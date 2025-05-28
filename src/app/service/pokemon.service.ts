// src/app/pokemon.service.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { map } from 'rxjs/operators';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class PokemonService {
  constructor(private http: HttpClient) {}

  getPokemonList(limit = 20, name = ''): Observable<any[]> {
    const url = 'http://localhost:3030/api/cards?name=${name}&limit=${limit}';
    return this.http.get<{ cards: any[] }>(url).pipe(map(res => res.cards));
  }
}