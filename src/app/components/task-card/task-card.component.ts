import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { Task } from '../../models/task';

@Component({
    selector: 'app-task-card',
    standalone: true,
    imports: [CommonModule, FormsModule, MatDialogModule],
    templateUrl: './task-card.component.html',
    styleUrls: ['./task-card.component.css']
})
export class TaskCardComponent {
    editedTask: Task;
    completedAtLocal: string = '';

    constructor(
        public dialogRef: MatDialogRef<TaskCardComponent>,
        @Inject(MAT_DIALOG_DATA) public data: { task: Task }
    ) {
        this.editedTask = { ...data.task };
        this.updateLocalDate();
    }

    updateLocalDate(){
        if (this.editedTask.completedAt){
            this.completedAtLocal = this.editedTask.completedAt.slice(0,16);
        } else {
            this.completedAtLocal = '';
        }
    }

    onCompletedChange(){
        if(!this.editedTask.completed) {
            this.editedTask.completedAt = null;
            this.completedAtLocal = '';
        } else {
            if(!this.editedTask.completedAt){
                const now = new Date();
                now.setSeconds(0,0);
                this.editedTask.completedAt = now.toISOString();
                this.updateLocalDate();
            }
        }
    }

    save() {
        if(this.editedTask.completed && this.completedAtLocal){
            const localDate = new Date(this.completedAtLocal);
            if(!isNaN(localDate.getTime())){
                this.editedTask.completedAt = localDate.toISOString();
            }
        } else if (!this.editedTask.completed){
            this.editedTask.completedAt = null;
        }
        this.dialogRef.close(this.editedTask);
    }

    cancel() {
        this.dialogRef.close();
    }
}