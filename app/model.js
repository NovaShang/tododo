/**
 * 
 */
class Task {
    constructor(title) {
        this.title = title;
        this.status = 'NotStarted',
            this.importance = 1,
            this.content = '',

            this.createdAt = Date.now();
        this.modifiedAt = Date.now();


    }
}

exports.Task = Task;