import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Task } from '../models/task';
import { AuthService } from './auth.service';

@Injectable({ providedIn: 'root' })
export class TaskService {
    private apiUrl = 'http://localhost:3000/api/tasks';

    constructor(private http: HttpClient, private auth: AuthService) { }

    private getAuthHeaders(): HttpHeaders {
        const token = this.auth.token;
        return new HttpHeaders({ 'Authorization': `Header ${token}` });
    }

    getTasks(): Observable<Task[]> {
        return this.http.get<Task[]>(this.apiUrl, { headers: this.getAuthHeaders() });
    }

    createTask(task: Partial<Task>): Observable<Task> {
        return this.http.post<Task>(this.apiUrl, task, { headers: this.getAuthHeaders() });
    }

    updateTask(task: Task): Observable<Task> {
        return this.http.put<Task>(this.apiUrl, task, { headers: this.getAuthHeaders() });
    }

    deleteTask(id: string): Observable<Task> {
        return this.http.delete<Task>(`${this.apiUrl}/${id}`, { headers: this.getAuthHeaders() });
    }
}