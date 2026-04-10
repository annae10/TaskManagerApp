import { Component, OnInit, ViewChild, ElementRef, AfterViewInit, OnDestroy } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';
import { Task } from './models/task';
import { TaskService } from './services/task.service';
import { AuthService } from './services/auth.service';
import { TaskCardComponent } from './components/task-card/task-card.component';
import { Subscription } from 'rxjs';

@Component({
    selector: 'app-tasks',
    standalone: true,
    imports: [CommonModule, FormsModule, DatePipe],
    templateUrl: './tasks.component.html',
    styleUrls: ['./tasks.component.css']
})
export class TasksComponent implements OnInit, AfterViewInit, OnDestroy {
    @ViewChild('chartCanvas') canvasRef!: ElementRef<HTMLCanvasElement>;

    tasks: Task[] = [];
    statusMessage = '';
    chartData: { date: Date; count: number }[] = [];
    userEmail = '';
    private sub?: Subscription;

    constructor(
        private taskService: TaskService,
        private authService: AuthService,
        private dialog: MatDialog,
        private router: Router
    ) {}

    ngOnInit() {
        this.authService.currentUser$.subscribe(user => {
            if (user) {
                this.userEmail = user.email;
                this.loadTasks();
            } else {
                this.router.navigate(['/login']);
            }
        });
    }

    ngAfterViewInit() { this.drawChart(); }
    ngOnDestroy() { this.sub?.unsubscribe(); }

    loadTasks() {
        this.taskService.getTasks().subscribe({
            next: (data) => {
                this.tasks = data;
                this.updateChartData();
                this.drawChart();
            },
            error: () => this.showMessage('Ошибка загрузки')
        });
    }

    updateChartData() {
        const today = new Date(); today.setHours(0,0,0,0);
        const last5Days = Array.from({ length: 5 }, (_, i) => {
            const d = new Date(today); d.setDate(today.getDate() - i); return d;
        }).reverse();
        this.chartData = last5Days.map(date => ({
            date,
            count: this.tasks.filter(t => t.completed && t.completedAt && new Date(t.completedAt).toDateString() === date.toDateString()).length
        }));
    }

    drawChart() {
        if (!this.canvasRef) return;
        const canvas = this.canvasRef.nativeElement;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        const width = canvas.clientWidth, height = canvas.clientHeight;
        canvas.width = width; canvas.height = height;
        ctx.clearRect(0,0,width,height);
        if (!this.chartData.length) return;
        const maxCount = Math.max(1, ...this.chartData.map(d => d.count));
        const barWidth = (width / this.chartData.length) * 0.7;
        const spacing = (width / this.chartData.length) * 0.3;
        this.chartData.forEach((item, i) => {
            const x = spacing/2 + i * (barWidth + spacing);
            const barHeight = (item.count / maxCount) * (height - 50);
            const y = height - barHeight - 20;
            const grad = ctx.createLinearGradient(x, y, x, y+barHeight);
            grad.addColorStop(0, '#3d3888'); grad.addColorStop(1, '#b628f8');
            ctx.fillStyle = grad;
            ctx.fillRect(x, y, barWidth, barHeight);
            ctx.fillStyle = '#333';
            ctx.fillText(`${item.date.getDate()}/${item.date.getMonth()+1}`, x+barWidth/2-15, height-5);
            ctx.fillStyle = '#000';
            ctx.fillText(item.count.toString(), x+barWidth/2-5, y-5);
        });
    }

    addTask() {
        this.taskService.createTask({ title: 'Новая задача', description: '' }).subscribe({
            next: () => {
                this.loadTasks()
                this.showMessage('Задача добавлена');
            },
            error: (err) => {
                if (err.status === 403) {
                    this.showMessage('Сессия истекла, войдите снова');
                    this.authService.logout();
                    this.router.navigate(['/login']);
                }
                console.error(err);
                this.showMessage('Ошибка при добавлении');
            }
    });
    }

    showMessage(text: string){
        this.statusMessage = text;
        setTimeout(() => {
            this.statusMessage = '';
        }, 3000);
    }
        
openTaskCard(task: Task) {
        const dialogRef = this.dialog.open(TaskCardComponent, { data: { task }, width: '600px' });
        dialogRef.afterClosed().subscribe(result => {
            if (result) this.taskService.updateTask(result).subscribe(() => this.loadTasks());
        });
    }

    deleteTask(id: string, event: Event) {
        event.stopPropagation();
        if (confirm('Удалить задачу?')) {
            this.taskService.deleteTask(id).subscribe(() => this.loadTasks());
        }
    }

    toggleComplete(task: Task, event: Event) {
        event.stopPropagation();
        const updated = { ...task, completed: !task.completed, completedAt: !task.completed ? new Date().toISOString() : null };
        this.taskService.updateTask(updated).subscribe(() => this.loadTasks());
    }

    logout() {
        this.authService.logout();
        this.router.navigate(['/login']);
    }
}