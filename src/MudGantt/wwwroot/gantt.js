class GanttTask {
    constructor(data) {

        this.id = data.id;
        this.data = data;
        this.shapes = {rect: null, links: []};
        this.startDate = null;
        this.endDate = null;

        if (data.startDate) {
            this.startDate = new Date(data.startDate);
            this.startEpochs = this.startDate.getTime();
        }
        if (data.endDate) {
            this.endDate = new Date(data.endDate);
            this.endEpochs = this.endDate.getTime();
        }
        this.startDate ??= this.endDate;
        this.endDate ??= this.startDate;
        this.startEpochs ??= this.endEpochs;
        this.endEpochs ??= this.startEpochs;

	if(!this.startEpochs) {
		throw new Error("No date set for task");
	}

	this.range = this.endEpochs - this.startEpochs;
    }
}

class GanntChart {
    constructor(id, selector, callback) {
        this.id = id;
        this.selector = selector;
        this.callback = callback;
        this.container = document.querySelector(selector);
        if (!this.container) {
            console.error(`Container with selector ${selector} not found.`);
            return;
        }

        const observer = new ResizeObserver(() => {
            if (this.data) {
                console.log("on resize");
                this.updateData(this.data);
            }
        });
        observer.observe(this.container);

        this.options = {};
        this.options.timelineEpochPadding = 1000 * 3600 * 24;
        this.options.axisPadding = 5;
        this.options.grid = 'auto';
        this.options.axisHeight = 50;
        this.options.footerHeight = 50;

        this.options.showAxis = true;
        this.options.progressHandleSize = 7;
        this.options.arrowSize = 7;
        this.options.arrowPadding = 10;
        this.options.taskHeight = 35;
        this.options.taskSpacing = 10;
        this.options.edgeSize = 5;
        this.options.textOffsetX = 5;
        this.options.textOffsetY = 2;

        this.tasks = [];
    }

    #reset() {

        if(!this.ganttChart) {

            // Clear existing content
            this.container.innerHTML = "";

            // Create a new Gantt chart element
            this.ganttChart = document.createElementNS("http://www.w3.org/2000/svg", "svg");

            // Add view box attribute to ganttChart
            //this.ganttChart.setAttribute('preserveAspectRatio', "none");
            //this.ganttChart.setAttribute('width', "100%");
            //this.ganttChart.setAttribute('height', "100%");
            this.container.appendChild(this.ganttChart);
            
            document.addEventListener("pointerup", (event) => { this.#onMouseUp(event); });
            this.ganttChart.addEventListener("mousewheel", (event) => { this.#onMouseWheel(event); });
            this.ganttChart.addEventListener("pointerdown", (event) => { this.#onMouseMove(event); this.#onMouseDown(event); });
            this.ganttChart.addEventListener("pointermove", (event) => { this.#onMouseMove(event); });
        } 
        this.ganttChart.innerHTML = "";

        // Size it
        const parentWidth = this.container.clientWidth;
        const h = this.options.axisHeight + this.data.items.length * (this.options.taskSpacing + this.options.taskHeight) + this.options.footerHeight;
        this.viewBoxWidth = parentWidth;
        this.viewBoxHeight = h;
        this.ganttChart.setAttribute('width', `${parentWidth}px`);
        this.ganttChart.setAttribute('height', `${h}px`);
        this.ganttChart.setAttribute('viewBox', `0 0 ${this.viewBoxWidth} ${this.viewBoxHeight}`);
    }

    #onMouseWheel(event) {
        if (event.altKey) {
            this.options.timelineEpochPadding += event.deltaY * 1000 * 240;
            this.updateData(this.data);
        }
    }

    #addTaskData() {

        this.tasks = [];
        this.minDate = null;
        this.maxDate = null;
        this.data.items.forEach(task => {
            const taskData = new GanttTask(task);

            // Determine date range for all items
            if (taskData.endDate) {
                if (!this.maxDate) {
                    this.maxDate = taskData.startDate;
                    this.maxDate = taskData.endDate;
                }
            }
            if (taskData.startDate) {
                if (!this.minDate) {
                    this.minDate = taskData.startDate;
                    this.minDate = taskData.startDate;
                }
            }
            if (taskData.startDate < this.minDate) {
                this.minDate = taskData.startDate;
            }
            if (taskData.endDate < this.minDate) {
                this.minDate = taskData.endDate;
            }
            if (taskData.startDate > this.maxDate) {
                this.maxDate = taskData.startDate;
            }
            if (taskData.endDate > this.maxDate) {
                this.maxDate = taskData.endDate;
            }

            this.tasks.push(taskData);
        });

        if (this.minDate) {

            this.minDate.setUTCHours(0);
            this.minDate.setUTCMinutes(0);
            this.minDate.setUTCSeconds(0);

            this.maxDate.setUTCHours(23);
            this.maxDate.setUTCMinutes(59);
            this.maxDate.setUTCSeconds(59);

        }

        if (this.minDate && this.options.timelineEpochPadding != 0) {
            let minEpochs = this.minDate.getTime();
            let maxEpochs = this.maxDate.getTime();

            //console.log("minEpochs", minEpochs);
            //console.log("timelineEpochPadding", this.options.timelineEpochPadding);

            minEpochs -= this.options.timelineEpochPadding / 2;
            maxEpochs += this.options.timelineEpochPadding / 2;
            this.minDate = new Date(minEpochs);
            this.maxDate = new Date(maxEpochs);
        }

    	if(this.minDate) {
    		this.minEpochs = this.minDate.getTime();
    		this.maxEpochs = this.maxDate.getTime();
    		this.range = this.maxEpochs - this.minEpochs;
    	}
    }

    createLinks() {
        const links = [];
        for(const task of this.tasks) {
            if(task.data.dependentOn) {
                for (const taskId of task.data.dependentOn) {
                    const matches = [...this.tasks.filter(x => x.data.id == taskId)];
                    for (const task2 of matches) {
                        links.push({task1: task, task2: task2});
                    }
                }
            }
        }
        for (const link of links) {
            this.createLink(link.task1, link.task2);
        }
    }

    createLink(task1, task2) {

        const spacing = this.options.arrowPadding;

        const pathLine = document.createElementNS("http://www.w3.org/2000/svg", "path");
        pathLine.setAttribute("data-type", "link-line");

        let d = `M${task1.x} ${task1.y + task1.height/2} `;

        const yDelta = task2.y - task1.y;
        const xDelta = task2.right - task1.left;

        if(xDelta > -spacing*2) {

            d += `h ${-spacing} `; // horizontal delta
            d += `v ${yDelta/2} `; // vertical delta1
            d += `h ${xDelta + spacing + spacing} `; // horizontal delta
            d += `v ${yDelta/2} `; // vertical delta2
            d += `h ${-spacing} `; // horizontal delta
        } else {

            d += `h ${xDelta+spacing} `; // horizontal delta
            d += `v ${yDelta} `; // vertical
            d += `h ${-spacing} `; // horizontal delta
        }
        pathLine.setAttribute("d", d);

        // Arrow
        let arrowSize = this.options.arrowSize;
        const pathArrow = document.createElementNS("http://www.w3.org/2000/svg", "path");
        pathArrow.setAttribute("data-type", "link-arrow");
        const arrowX = task1.left;
        const arrowY = task1.top + task1.height / 2;
        let dArrow = `M${arrowX} ${arrowY} `;
        dArrow += `L${arrowX - arrowSize} ${arrowY - arrowSize / 2} `;
        dArrow += `L${arrowX - arrowSize} ${arrowY + arrowSize / 2} `;
        //dArrow += `L${arrowX} ${arrowY} `;
        pathArrow.setAttribute("d", dArrow);

        this.ganttChart.insertBefore(pathLine, this.ganttChart.firstChild);
        this.ganttChart.insertBefore(pathArrow, this.ganttChart.firstChild);
        task1.shapes.links.push(pathLine);
        task1.shapes.links.push(pathArrow);
    }

    updateLinks() {
        this.removeLinks();
        this.createLinks();
    }

    removeLinks() {
        for(const task of this.tasks) {
            for(const link of task.shapes.links) {
                link.remove();
            }
            task.shapes.links = [];
        }
    }

    #createAxis() {

        const state = {};

        // axis header background
        const axisBack = document.createElementNS("http://www.w3.org/2000/svg", "rect");
        axisBack.setAttribute('data-type', "axis-background");
        axisBack.setAttribute('x', 0);
        axisBack.setAttribute('y', 0);
        axisBack.setAttribute('width', this.viewBoxWidth);
        axisBack.setAttribute('height', this.options.axisHeight);
        this.ganttChart.appendChild(axisBack);

        this.#addAxisDateLabel(state, 0, this.minDate, 'start');
        this.#addGridLine(0);

        //this.#addAxisDateLabel(this.viewBoxWidth, this.maxDate, 'end');
        //this.#addGridLine(this.viewBoxWidth);

        let gridStyle = this.options.grid ?? 'day';
        if (gridStyle == 'auto') {
            gridStyle = 'day';
            const oneDay = 24 * 60 * 60 * 1000; 
            const diffDays = Math.round(Math.abs((this.maxDate - this.minDate) / oneDay));

            if (diffDays > 20) {
                gridStyle = 'week';
            }
        }

        let stepDays = 1;
        if (gridStyle == 'day') {
            stepDays = 1;
        }

        if (gridStyle == 'week') {
            stepDays = 7;
        }
        let date = this.minDate;
        date.setUTCHours(0);
        date.setUTCMinutes(0);
        date.setUTCSeconds(0);
        while (date < this.maxDate) {
            var result = new Date(date);
            result.setDate(result.getDate() + stepDays);

            const dayX = (result.getTime() - this.minEpochs) * this.viewBoxWidth / this.range;
            this.#addGridLine(dayX);
            this.#addAxisDateLabel(state, dayX, result, 'middle');

            date = result;
        }
    }

    #addAxisDateLabel(state, x, axisDate, textAnchor) {

        // Note: moment.js is required
        if (typeof moment !== "undefined") {
            const m = moment(axisDate);
            let label = m.format("yyyy-MM-DD")

            const yearChanged = state.year != axisDate.getFullYear();
            const monthChanged = state.month != axisDate.getMonth();
            const dateChanged = state.date != axisDate.getDate();

            //console.log(`${label}: yearChanged=${yearChanged}, monthChanged=${monthChanged}, dateChanged=${dateChanged}`);

            if (x == 0) {
                x = this.options.axisPadding;
            }

            const h = this.options.axisHeight - this.options.axisPadding * 2;

            const displayDate = m.local();

            if (yearChanged) {

                const dateTextElement = document.createElementNS("http://www.w3.org/2000/svg", "text");
                dateTextElement.setAttribute('data-type', "axis-date");
                dateTextElement.setAttribute('data-subtype', "year");
                dateTextElement.setAttribute('x', x);
                dateTextElement.setAttribute('y', this.options.axisPadding);
                dateTextElement.setAttribute('text-anchor', textAnchor);
                dateTextElement.innerHTML = displayDate.format("YYYY");
                this.ganttChart.appendChild(dateTextElement);
            }

            if (monthChanged) {

                const dateTextElement = document.createElementNS("http://www.w3.org/2000/svg", "text");
                dateTextElement.setAttribute('data-type', "axis-date");
                dateTextElement.setAttribute('data-subtype', "month");
                dateTextElement.setAttribute('x', x);
                dateTextElement.setAttribute('y', this.options.axisPadding + h/3);
                dateTextElement.setAttribute('text-anchor', textAnchor);
                dateTextElement.innerHTML = displayDate.format("MMM");
                this.ganttChart.appendChild(dateTextElement);
            }


            if (dateChanged) {

                const dateTextElement = document.createElementNS("http://www.w3.org/2000/svg", "text");
                dateTextElement.setAttribute('data-type', "axis-date");
                dateTextElement.setAttribute('data-subtype', "day");
                dateTextElement.setAttribute('data-day-of-week', m.format("E"));
                dateTextElement.setAttribute('x', x);
                dateTextElement.setAttribute('y', this.options.axisPadding + h * 2 / 3);
                dateTextElement.setAttribute('text-anchor', textAnchor);
                dateTextElement.innerHTML = displayDate.format("DD");
                this.ganttChart.appendChild(dateTextElement);
            }

            // Keep track of the date so we know which elements we need to add
            state.year = axisDate.getFullYear();
            state.month = axisDate.getMonth();
            state.date = axisDate.getDate();

        }
    }

    #addGridLine(x, dataType) {
        const line = document.createElementNS("http://www.w3.org/2000/svg", "line");
        line.setAttribute('data-type', dataType??"grid-line");
        line.setAttribute('x1', x);
        line.setAttribute('x2', x);
        line.setAttribute('y1', this.options.axisHeight);
        line.setAttribute('y2', this.viewBoxHeight - this.options.footerHeight);
        this.ganttChart.appendChild(line);
    }

    #addEvents() {
        for (const evt of this.data.events) {
            const evtEpochs = new Date(evt.date).getTime();
            const relativeEpochs = (evtEpochs - this.minEpochs);
            const x = relativeEpochs * this.viewBoxWidth / this.range;
            const y = this.viewBoxHeight - this.options.footerHeight;

            const textElement = document.createElementNS("http://www.w3.org/2000/svg", "text");
            textElement.setAttribute('data-type', "event");
            textElement.setAttribute('x', x);
            textElement.setAttribute('y', y);
            textElement.setAttribute('text-anchor', 'middle');
            textElement.innerHTML = evt.name;
            this.ganttChart.appendChild(textElement);

            this.#addGridLine(x, "event-line");

            // Add a diamond
            const diamondSize = 15;
            const shape = document.createElementNS("http://www.w3.org/2000/svg", "path");
            let d = `M${x} ${y} `;
            d += `L${x - diamondSize/2} ${y - diamondSize/2} `;
            d += `L${x} ${y - diamondSize} `;
            d += `L${x + diamondSize / 2} ${y - diamondSize / 2} `;
            shape.setAttribute('d', d);
            shape.setAttribute('data-type', "event-shape");
            this.ganttChart.appendChild(shape);
        }
    }

    updateData(data) {

        if (!data.items) {
            console.warn("no tasks", data);
            data.items = [];
        }
        this.readOnly = data.readOnly;

        this.data = data;

        this.#reset();
        this.#addTaskData();

        // Populate the Gantt chart with data
        const taskHeight = this.options.taskHeight;

        const rowHeight = taskHeight + this.options.taskSpacing;

        let y = 0;
        if (this.options.showAxis) {
            this.#createAxis();
            y += this.options.axisHeight;
        }

        if (this.data.events && this.data.events.length > 0) {
            this.#addEvents();
        }

        for (const task of this.tasks) {

            const relativeEpochs = (task.startEpochs - this.minEpochs);
            const x = relativeEpochs * this.viewBoxWidth / this.range;
            const width = task.range * this.viewBoxWidth / this.range;

            // console.log(`${task.data.name}: task.relativeEpochs=${relativeEpochs}, task.range=${task.range}, this.range=${this.range}, x=${x}, fill=${task.fill}`);

            const taskElement = document.createElementNS("http://www.w3.org/2000/svg", "rect");
            taskElement.setAttribute('data-id', task.data.id);
            taskElement.setAttribute("data-type", "task");
            taskElement.setAttribute('rx', 2);
            taskElement.setAttribute('x', x);
            taskElement.setAttribute('y', y);
            taskElement.setAttribute('width', width);
            taskElement.setAttribute('height', taskHeight);
            if (task.data.class) {
                taskElement.setAttribute('class', task.data.class);
            }
            if (task.data.color) {
                taskElement.setAttribute('style', `fill: ${task.data.color}`);
            }
            task.left = task.x = x;
            task.top = task.y = y;
            task.width = width;
            task.height = taskHeight;
            task.bottom = task.y + taskHeight;
            task.right = task.x + width;
            task.shapes.rect = taskElement;
            this.ganttChart.appendChild(taskElement);

            // Show progress
            if(task.data.progress !== undefined && task.data.progress !== null) {

                const progressWidth = width * task.data.progress;

                const progressElement = document.createElementNS("http://www.w3.org/2000/svg", "rect");
                progressElement.setAttribute("data-type", "progress");
                progressElement.setAttribute('rx', 2);
                progressElement.setAttribute('x', x);
                progressElement.setAttribute('y', y);
                progressElement.setAttribute('width', progressWidth);
                progressElement.setAttribute('height', task.height);

                if (task.data.progressColor) {
                    progressElement.setAttribute('style', `fill: ${task.data.progressColor}`);
                }

                task.shapes.progress = progressElement;
                this.ganttChart.appendChild(progressElement);
            }

            // Edges to resize the task
            const edgeLeft = document.createElementNS("http://www.w3.org/2000/svg", "rect");
            edgeLeft.setAttribute("data-type", "edge-left");
            edgeLeft.setAttribute('rx', 2);
            edgeLeft.setAttribute('x', task.left);
            edgeLeft.setAttribute('y', task.top);
            edgeLeft.setAttribute('width', this.options.edgeSize);
            edgeLeft.setAttribute('height', task.height);
            edgeLeft.setAttribute('opacity', "0");
            task.shapes.edgeLeft = edgeLeft;
            this.ganttChart.appendChild(edgeLeft);

            const edgeRight = document.createElementNS("http://www.w3.org/2000/svg", "rect");
            edgeRight.setAttribute("data-type", "edge-right");
            edgeRight.setAttribute('rx', 2);
            edgeRight.setAttribute('x', task.right - this.options.edgeSize);
            edgeRight.setAttribute('y', task.top);
            edgeRight.setAttribute('width', this.options.edgeSize);
            edgeRight.setAttribute('height', task.height);
            edgeRight.setAttribute('opacity', "0");
            task.shapes.edgeRight = edgeRight;
            this.ganttChart.appendChild(edgeRight);

            // Text label
            const textElement = document.createElementNS("http://www.w3.org/2000/svg", "text");
            textElement.setAttribute('x', x + this.options.textOffsetX);
            textElement.setAttribute('y', y + this.options.textOffsetY);
            textElement.setAttribute('width', width);
            textElement.setAttribute('height', taskHeight);
            textElement.innerHTML = task.data.name;
            task.shapes.text = textElement;
            this.ganttChart.appendChild(textElement);

            if (task.data.progress !== undefined && task.data.progress !== null) {
                const progressWidth = width * task.data.progress;

                // Text label for progress
                const textProgressElement = document.createElementNS("http://www.w3.org/2000/svg", "text");
                textProgressElement.setAttribute('data-type', "progress-label");
                textProgressElement.setAttribute('x', x + this.options.textOffsetX);
                textProgressElement.setAttribute('y', y + task.height - this.options.textOffsetY);
                textProgressElement.setAttribute('width', width);
                textProgressElement.setAttribute('height', taskHeight);
                textProgressElement.innerHTML = Math.round(task.data.progress*100) + "%";
                task.shapes.progressText = textProgressElement;
                this.ganttChart.appendChild(textProgressElement);

                // Change progress handle
                if (!this.readOnly) {
                    const progressHandleElement = document.createElementNS("http://www.w3.org/2000/svg", "path");
                    progressHandleElement.setAttribute('data-type', "progress-handle");
                    this.#createProgressHandlePath(task, progressHandleElement, progressWidth);
                    task.shapes.progressHandle = progressHandleElement;
                    this.ganttChart.appendChild(progressHandleElement);
                }

            }

            y += rowHeight;
        }

        this.createLinks();
    }

    #createProgressHandlePath(task, progressHandleElement, progressWidth) {
        const handleSize = this.options.progressHandleSize;
        const handleSizeHalf = this.options.progressHandleSize / 2;
        const arrowX = task.left + progressWidth;
        const arrowY = task.bottom;
        let dArrow = `M${arrowX} ${arrowY} `;
        dArrow += `L${arrowX + handleSizeHalf} ${arrowY + handleSize} `;
        dArrow += `L${arrowX - handleSizeHalf} ${arrowY + handleSize} `;
        progressHandleElement.setAttribute("d", dArrow);

        task.progressHandleArea = { x: arrowX - handleSizeHalf, y: arrowY, width: handleSize, height: handleSize };
        task.progressHandleArea.left = task.progressHandleArea.x;
        task.progressHandleArea.top = task.progressHandleArea.y;
        task.progressHandleArea.right = task.progressHandleArea.left + task.progressHandleArea.width;
        task.progressHandleArea.bottom = task.progressHandleArea.y + task.progressHandleArea.height;
    }

    #cursorPoint(evt){
        const pt = this.ganttChart.createSVGPoint();
        pt.x = evt.clientX; 
        pt.y = evt.clientY;
        return pt.matrixTransform(this.ganttChart.getScreenCTM().inverse());
    }
    #onMouseDown(event) {

        console.log("#onMouseDown");

        if (this.readOnly) {
            return;
        }
        this.mouseDownPoint = this.#cursorPoint(event);
        this.isMoving = false;
        this.moveTaskArea = null;
        this.dragProgress = false;
        if (this.hoverLeftEdge || this.hoverRightEdge) {
            this.isDragging = true;
        } else if (this.hoverProgressHandle) {
            if (this.hoverTask?.data?.progress !== undefined && this.hoverTask?.data?.progress !== null) {
                const task = this.hoverTask;
                const pt = this.#cursorPoint(event);
                const progress = (pt.x - task.x) / task.width;
                this.setProgress(task, progress, false);
                this.isDragging = true;
                this.dragProgress = true;
                this.dragTask = task;
            }
        } else if (this.hoverTask) {
            const task = this.hoverTask;
            this.isDragging = true;
            this.isMoving = true;
            this.dragTask = task;
            this.moveTaskArea = { x: task.x, width: task.width, left: task.left, right: task.right };
        }
    }

    setProgress(task, progress, raiseEvent) {
        if(progress < 0) {
            progress = 0;
        }
        if(progress > 1) {
            progress = 1;
        }
        task.data.progress = progress;
        if(task.shapes.progress) {
            task.shapes.progress.setAttribute("width", task.data.progress * task.width);
        }
        if (task.shapes.progressHandle) {
            this.#createProgressHandlePath(task, task.shapes.progressHandle, task.data.progress * task.width);
        }
        if(task.shapes.progressText) {
            const progressText = Math.round(progress*100.0) + "%";
            task.shapes.progressText.innerHTML = progressText;
        }

        if (raiseEvent && this.callback) {
            this.callback.invokeMethodAsync("OnProgressChangedAsync", task.id, progress);
        }
    }

    #snapX(x) {
        return x;
        //return parseInt(x/50)*50;
    }

    #setTaskX(task,x) {
        x = this.#snapX(x);

        task.x = x;
        task.left = x;
        task.right = task.left + task.width;

        this.#onTaskMoved(task);
    }

    #onTaskMoved(task) {
        const x = task.x;
        const width = task.width;

        task.shapes.rect?.setAttribute("x", x);
        task.shapes.rect?.setAttribute("width", width);

        task.shapes.edgeLeft?.setAttribute("x", x);
        task.shapes.edgeRight?.setAttribute("x", x + width - this.options.edgeSize);

        task.shapes.text?.setAttribute("x", x + this.options.textOffsetX);
        task.shapes.progressText?.setAttribute("x", x + this.options.textOffsetX);

        if (task.data.progress !== null && task.data.progress !== undefined) {
            task.shapes.progress?.setAttribute("x", x);
            task.shapes.progress?.setAttribute("width", width * task.data.progress);
            this.setProgress(task, task.data.progress, false);
        }
        this.updateLinks();

    }

    #updateTaskFromEdges() {
        const task = this.dragTask;
        if(this.hoverRightEdge) {
            let x = parseInt(task.shapes.edgeRight.getAttribute("x")) + this.options.edgeSize;
            if (task.left+5 > x) {
                x = task.left+5;
            }
            x = this.#snapX(x);
            task.right = x;
            const width = task.right - task.left;
            task.width = width;

            this.#onTaskMoved(task);
        }
        else if(this.hoverLeftEdge) {
            let x = parseInt(task.shapes.edgeLeft.getAttribute("x"));
            if (task.right-5 < x) {
                x = task.right-5;
            }

            x = this.#snapX(x);

            task.left = task.x = x;
            const width = task.right - x;
            task.width = width;

            this.#onTaskMoved(task);
        }
    }

    #onMouseUp(event) {
        console.log("#onMouseUp");

        if(this.isDragging) {
            if(this.isDragging && this.dragTask) {
                this.#updateTaskFromEdges();
            }

            if (this.hoverProgressHandle) {
                if (this.hoverTask?.data?.progress !== undefined && this.hoverTask?.data?.progress !== null) {
                    const task = this.hoverTask;
                    this.setProgress(task, this.hoverTask.data.progress, true);
                }
            }
            this.isDragging = false;
            this.dragProgress = false;
        }

        if ((this.isMoving || this.hoverLeftEdge || this.hoverRightEdge) && this.dragTask) {
            this.#updateViewport(this.dragTask);

            if (this.callback) {
                this.callback.invokeMethodAsync("OnTaskMovedAsync", this.dragTask.id, this.dragTask.startDate?.toISOString(), this.dragTask.endDate?.toISOString());
            }
        }
    }

    #updateViewport(task) {

        // Calculate start and end dates
        const x = task.x;
        const width = task.width;
        const totalEpochs = this.range;
        const startEpochs = this.minEpochs + (x * totalEpochs / this.viewBoxWidth);
        const endEpochs = startEpochs + (width * totalEpochs / this.viewBoxWidth);
        task.startDate = new Date(startEpochs);
        task.endDate = new Date(endEpochs);

        // Update task items
        console.log(this.data.items);
        for (const item of this.data.items.filter(x => x.id == task.id)) {
            item.startDate = task.startDate;
            item.endDate = task.endDate;
        }

        this.updateData(this.data);
    }

    #onMouseMove(event) {

        const pt = this.#cursorPoint(event);
        const nx = pt.x;
        const ny = pt.y;

        // console.log(`nx=${nx}`, pt);

        if (this.isDragging && this.dragTask && !this.readOnly) {
            if (this.hoverProgressHandle) {
                const task = this.dragTask;
                const progress = (pt.x - task.x) / task.width;
                this.setProgress(task, progress, false);
            }
            else if (this.hoverLeftEdge) {
                this.dragTask.shapes.edgeLeft.setAttribute("x", pt.x);
                this.#updateTaskFromEdges();
            }
            else if (this.hoverRightEdge) {
                this.dragTask.shapes.edgeRight.setAttribute("x", pt.x);
                this.#updateTaskFromEdges();
            } else if (this.isMoving && this.mouseDownPoint && this.moveTaskArea) {
                // Move the task
                const deltaX = pt.x - this.mouseDownPoint.x;
                const x = this.moveTaskArea.x + deltaX;
                const task = this.dragTask;
                this.#setTaskX(task,x);
            }
            return;
        }

        this.hoverTask = null;
        this.hoverProgressHandle = false;
        this.hoverLeftEdge = false;
        this.hoverRightEdge = false;
        this.hoverProgress = false;

        const edgeSize = this.options.edgeSize;

        for (const task of this.tasks) {

            if (task.progressHandleArea && nx >= task.progressHandleArea.left && nx < task.progressHandleArea.right && ny >= task.progressHandleArea.top && ny < task.progressHandleArea.bottom) {
                this.hoverProgressHandle = true;
                this.hoverTask = task;

                if (!this.readOnly) {
                    this.dragTask = task;
                }
            }
            else if (nx >= task.left && nx < task.right && ny >= task.top && ny < task.bottom) {

                this.hoverTask = task;
                if (!this.readOnly) {
                    this.dragTask = task;
                }

                task.shapes.rect.setAttribute("data-hover", "true");
                if (task.shapes.progress) {
                    task.shapes.progress.setAttribute("data-hover", "true");
                }

                // Over right edge
                if (nx >= task.right - edgeSize && nx < task.right && ny >= task.top && ny < task.bottom && !this.readOnly) {
                    // Hover right
                    this.hoverRightEdge = true;
                    task.shapes.edgeRight.setAttribute("opacity", 1);
                    task.shapes.edgeLeft.setAttribute("opacity", 0);
                }
                else if (nx >= task.left && nx < task.left + edgeSize && ny >= task.top && ny < task.bottom && !this.readOnly) {
                    // Hover left
                    this.hoverLeftEdge = true;
                    task.shapes.edgeRight.setAttribute("opacity", 0);
                    task.shapes.edgeLeft.setAttribute("opacity", 1);
                } else {
                    task.shapes.edgeRight.setAttribute("opacity", 0);
                    task.shapes.edgeLeft.setAttribute("opacity", 0);
                }

            } else {
                task.shapes.rect.removeAttribute("data-hover");

                task.shapes.edgeRight.setAttribute("opacity", 0);
                task.shapes.edgeLeft.setAttribute("opacity", 0);

                if (task.shapes.progress) {
                    task.shapes.progress.removeAttribute("data-hover");
                }
            }
        }
    }
}

window.blazorGanttCharts = {};

export function initGantt(id, selector, callback) {
    const instance = new GanntChart(id, selector, callback);
    window.blazorGanttCharts[id] = instance;
}

export function updateGantt(id, data) {
    if (window.blazorGanttCharts[id]) {
        console.log("updating..", data);
        window.blazorGanttCharts[id].updateData(data);
    }
}

export function destroyGantt(id) {
    if (window.blazorGanttCharts[id]) {
        delete window.blazorGanttCharts[id]
    }
}