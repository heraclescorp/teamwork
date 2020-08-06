'use strict';

const internals = {};


exports.Team = class {
    constructor(options) {
        this._meetings = null;
        this._count = null;
        this._notes = null;
        this._done = false;
        this._strict = false;

        this._init(options);
    }

    _init(options = {}) {

        this.work = new Promise((resolve, reject) => {

            this._resolve = resolve;
            this._reject = reject;
        });

        const meetings = options.meetings || 1;
        this._meetings = meetings;
        this._count = meetings;
        this._notes = [];
        this._done = false;
        this._strict = options.strict;
    }

    attend(note) {

        if (this._strict && this._done) {
            throw new Error('Unscheduled meeting');
        }

        if (note instanceof Error) {
            this._done = true;
            return this._reject(note);
        }

        this._notes.push(note);

        if (--this._count) {
            return;
        }

        this._done = true;
        return this._resolve(this._meetings === 1 ? this._notes[0] : this._notes);
    }

    async regroup(options) {

        await this.work;

        this._init(options);
    }
};


exports.Events = class {

    constructor() {
        this._pending = null;
        this._queueArray = [];
    }

    static isIterator(iterator) {

        return iterator instanceof internals.EventsIterator;
    }

    iterator() {

        return new internals.EventsIterator(this);
    }

    emit(value) {

        this._queue({ value, done: false });
    }

    end() {

        this._queue({ done: true });
    }

    _next() {

        if (this._queueArray.length) {
            return Promise.resolve(this._queueArray.shift());
        }

        this._pending = new exports.Team();
        return this._pending.work;
    }

    _queue(item) {

        if (this._pending) {
            this._pending.attend(item);
            this._pending = null;
        }
        else {
            this._queueArray.push(item);
        }
    }
};


internals.EventsIterator = class {
    constructor(events) {
        this._events = events;
    }

    [Symbol.asyncIterator]() {

        return this;
    }

    next() {

        return this._events._next();
    }
};
