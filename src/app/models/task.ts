export class Task{
    constructor(
        public _id: string,
        public title: string,
        public description: string,
        public completed: boolean,
        public completedAt: string | null,
        public createdAt: string) { }
}