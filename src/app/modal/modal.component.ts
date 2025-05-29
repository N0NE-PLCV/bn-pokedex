// src/app/modal/modal.component.ts
import { Component, EventEmitter, Input, Output, OnChanges, SimpleChanges } from '@angular/core'; // Added OnChanges, SimpleChanges
import { PokemonService } from '../service/pokemon.service';
import { forkJoin, of } from 'rxjs';
import { catchError } from 'rxjs/operators';

@Component({
  selector: 'app-modal',
  templateUrl: './modal.component.html',
  styleUrls: ['./modal.component.scss']
})
export class ModalComponent implements OnChanges { // Added OnChanges
  @Input() isOpen: boolean = false;
  @Input() pokedexList: any[] = []; // New Input: list of Pokémon in the Pokedex
  @Output() close = new EventEmitter<void>();
  @Output() pokemonAdded = new EventEmitter<any>();

  searchText: string = '';
  private pokemonListFromApi: any[] = []; // Stores raw API results
  displayablePokemonList: any[] = []; // Pokémon to display in modal (filtered)

  constructor(private pokemonService: PokemonService) {}

  ngOnChanges(changes: SimpleChanges): void {
    // If the pokedexList input changes (e.g., a Pokémon is added or removed from the Pokedex),
    // update the displayable list in the modal.
    if (changes['pokedexList']) {
      this.updateDisplayablePokemonList();
    }
  }

  closeModal() {
    this.close.emit();
    this.pokemonListFromApi = []; // Clear API list
    this.displayablePokemonList = []; // Clear display list
    this.searchText = '';
  }

  searchPokemon() {
    const term = this.searchText.trim().toLowerCase();

    if (!term) {
      this.pokemonListFromApi = [];
      this.updateDisplayablePokemonList();
      return;
    }

    // Preserve existing search logic by name and type
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
        this.pokemonListFromApi = Array.from(uniqueResultsMap.values());
        this.updateDisplayablePokemonList(); // Update displayable list after fetching
      },
      error: (err) => {
        console.error('Error in combined Pokémon search:', err);
        this.pokemonListFromApi = [];
        this.updateDisplayablePokemonList();
      }
    });
  }

  private updateDisplayablePokemonList() {
    // Filter out Pokémon that are already in the Pokedex
    const pokedexIds = new Set(this.pokedexList.map(p => p.id));
    this.displayablePokemonList = this.pokemonListFromApi.filter(p => !pokedexIds.has(p.id));
  }

  addPokemonToPokedex(pokemon: any) {
    this.pokemonAdded.emit(pokemon);
    // After emitting, Angular's change detection will update pokedexList in app.component,
    // which then triggers ngOnChanges here, and updateDisplayablePokemonList will be called,
    // effectively removing the Pokémon from the modal's view.
  }

  // Stat calculation and helper methods (getHappinessArray is not strictly needed if using the [0,1,2,3,4] loop)
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

  private calculateHp(hp?: string): number { return hp ? Math.min(100, parseInt(hp,10) || 0) : 0; }
  private calculateStrength(attacks?: any[]): string { return attacks ? `${Math.min(100, attacks.length * 50)}%` : '0%'; }
  private calculateWeakness(weaknesses?: any[]): string { return weaknesses ? `${Math.min(100, weaknesses.length * 100)}%` : '0%'; }
  private calculateTotalDamage(attacks?: any[]): number {
    if (!attacks) return 0;
    return attacks.reduce((sum, attack) => sum + (parseInt(attack.damage?.match(/\d+/)?.[0] || '0', 10) || 0), 0);
  }
  private calculateHappiness(hp: number, damage: number, weaknesses?: any[]): number {
    const weaknessCount = weaknesses?.length || 0;
    const happiness = Math.max(0, Math.round(((hp / 10) + (damage / 20) + 10 - weaknessCount) / 4));
    return Math.min(6, happiness); // Ensure maximum of 6 stars
  }
}