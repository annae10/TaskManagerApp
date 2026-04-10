import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import {User} from '../models/user'

@Injectable({ providedIn: 'root' })
export class AuthService {
    private apiUrl = 'http://localhost:3000/api/auth';
    private tokenKey = 'jwt_token';
    private userKey = 'user_data';
    private currentUserSubject = new BehaviorSubject<User | null>(null);

    constructor(private http: HttpClient) {
        const storedUser = localStorage.getItem(this.userKey);
        if (storedUser) this.currentUserSubject.next(JSON.parse(storedUser));
    }

    get currentUser$(): Observable<User | null> {
        return this.currentUserSubject.asObservable();
    }

    get token(): string | null {
        return localStorage.getItem(this.tokenKey);
    }

    register(email: string, password: string): Observable<any> {
        return this.http.post<{ token: string, user: User }>(`${this.apiUrl}/register`, { email, password })
            .pipe(tap(res => this.setSession(res)));
    }

    login(email: string, password: string): Observable<any> {
        return this.http.post<{ token: string, user: User }>(`${this.apiUrl}/login`, { email, password })
            .pipe(tap(res => this.setSession(res)));
    }

    logout(): void {
        localStorage.removeItem(this.tokenKey);
        localStorage.removeItem(this.userKey);
        this.currentUserSubject.next(null);
    }

    private setSession(authResult: { token: string, user: User }): void {
        localStorage.setItem(this.tokenKey, authResult.token);
        localStorage.setItem(this.userKey, JSON.stringify(authResult.user));
        this.currentUserSubject.next(authResult.user);
    }
}