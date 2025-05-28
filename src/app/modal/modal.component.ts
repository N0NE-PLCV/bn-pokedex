// src/app/modal/modal.component.ts
import { Component, EventEmitter, Input, Output } from '@angular/core'; // Removed OnInit, OnDestroy
import { PokemonService } from '../service/pokemon.service';
import { forkJoin, of } from 'rxjs'; // Removed Subject, Subscription
import { map, catchError } from 'rxjs/operators'; // Removed debounceTime, distinctUntilChanged, switchMap

@Component({
  selector: 'app-modal',
  templateUrl: './modal.component.html',
  styleUrls: ['./modal.component.scss'] // Ensure this path is correct
})
export class ModalComponent { // Removed implements OnInit, OnDestroy
  @Input() isOpen: boolean = false;
  @Output() close = new EventEmitter<void>();
  @Output() pokemonAdded = new EventEmitter<any>();

  searchText: string = '';
  pokemonList: any[] = [];

  // Removed searchSubject and searchSubscription

  constructor(private pokemonService: PokemonService) {}

  // Removed ngOnInit and ngOnDestroy

  closeModal() {
    this.close.emit();
    this.pokemonList = []; // Clear list when modal closes
    this.searchText = ''; // Reset search text
  }

  // Reverted to explicit searchPokemon method
  searchPokemon() {
    const term = this.searchText.trim().toLowerCase();

    if (!term) {
      this.pokemonList = [];
      return;
    }

    const searchByName$ = this.pokemonService.getPokemonList(20, term, '').pipe(
      catchError(err => {
        console.error('Error fetching Pokémon by name:', err);
        return of([]);
      })
    );

    const searchByType$ = this.pokemonService.getPokemonList(20, '', term).pipe(
      catchError(err => {
        console.error('Error fetching Pokémon by type:', err);
        return of([]);
      })
    );

    forkJoin([searchByName$, searchByType$]).subscribe({
      next: ([nameResults, typeResults]) => {
        const combinedResults = [...(nameResults || []), ...(typeResults || [])];

        const uniqueResultsMap = new Map<string, any>();
        combinedResults.forEach(pokemon => {
          if (pokemon && pokemon.id && !uniqueResultsMap.has(pokemon.id)) {
            // Calculate stats (assuming these methods are still present from previous steps)
            const calculatedHp = this.calculateHp(pokemon.hp);
            const calculatedStrength = this.calculateStrength(pokemon.attacks);
            const calculatedWeakness = this.calculateWeakness(pokemon.weaknesses);
            const totalDamage = this.calculateTotalDamage(pokemon.attacks);
            const calculatedHappiness = this.calculateHappiness(calculatedHp, totalDamage, pokemon.weaknesses);

            uniqueResultsMap.set(pokemon.id, {
              ...pokemon,
              types: pokemon.types ? pokemon.types : (pokemon.type ? [pokemon.type] : []),
              calculatedHp,
              calculatedStrength,
              calculatedWeakness,
              calculatedHappiness,
            });
          }
        });
        this.pokemonList = Array.from(uniqueResultsMap.values());
      },
      error: (err) => {
        console.error('Error in combined Pokémon search:', err);
        this.pokemonList = [];
      }
    });
  }

  addPokemonToPokedex(pokemon: any) {
    console.log('Add to Pokedex (implement this):', pokemon);
    this.pokemonAdded.emit(pokemon);
  }

  // Ensure these stat calculation and helper methods are present from previous steps:
  // calculateHp, calculateStrength, calculateWeakness, parseDamage,
  // calculateTotalDamage, calculateHappiness, getHappinessArray, getStatPercentage

  getHappinessArray(count: number): any[] {
    const safeCount = Math.max(0, Math.floor(count));
    const displayCount = Math.min(safeCount, 5);
    return new Array(displayCount);
  }

  getStatPercentage(statString: string | undefined): number {
    if (!statString) return 0;
    const match = statString.match(/(\d+)/);
    return match ? parseInt(match[0], 10) : 0;
  }

  // Dummy stat calculation functions if you removed them (replace with your actual ones)
  private calculateHp(hp?: string): number { return hp ? Math.min(100, parseInt(hp,10) || 0) : 0; }
  private calculateStrength(attacks?: any[]): string { return attacks ? `${Math.min(100, attacks.length * 50)}%` : '0%'; }
  private calculateWeakness(weaknesses?: any[]): string { return weaknesses ? `${Math.min(100, weaknesses.length * 100)}%` : '0%'; }
  private calculateTotalDamage(attacks?: any[]): number {
    if (!attacks) return 0;
    return attacks.reduce((sum, attack) => sum + (parseInt(attack.damage?.match(/\d+/)?.[0] || '0', 10) || 0), 0);
  }
  private calculateHappiness(hp: number, damage: number, weaknesses?: any[]): number {
    const weaknessCount = weaknesses?.length || 0;
    return Math.max(0, Math.round(((hp / 10) + (damage / 10) + 10 - weaknessCount) / 5));
  }
}