// src/app/service/pokemon.service.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { map, catchError } from 'rxjs/operators';
import { Observable, of } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class PokemonService {
  constructor(private http: HttpClient) {}

  getPokemonList(limit: number = 20, name: string = '', pokemonType: string = ''): Observable<any[]> {
    let url = `http://localhost:3030/api/cards?limit=${limit}`;

    if (name) {
      url += `&name=${encodeURIComponent(name)}`;
    }
    if (pokemonType) {
      url += `&type=${encodeURIComponent(pokemonType)}`;
    }

    return this.http.get<{ cards: any[] }>(url).pipe(
      map(res => res.cards || []), // Ensure 'cards' exists, default to empty array
      catchError(err => {
        console.error('Error fetching Pokémon list from service:', err);
        return of([]); 
      })
    );
  }
}
