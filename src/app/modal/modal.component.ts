// src/app/modal/modal.component.ts
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { PokemonService } from '../service/pokemon.service';
// ADD THESE IMPORTS for forkJoin, of, map, catchError
import { forkJoin, of } from 'rxjs';
import { map, catchError } from 'rxjs/operators';

@Component({
  selector: 'app-modal',
  templateUrl: './modal.component.html',
  styleUrls: ['./modal.component.scss'] // Make sure this path is correct
})
export class ModalComponent {
  @Input() isOpen: boolean = false;
  @Output() close = new EventEmitter<void>();
  // If you have an @Output for pokemonAdded, keep it:
  @Output() pokemonAdded = new EventEmitter<any>(); 

  searchText: string = ''; // This is your existing single input field model
  pokemonList: any[] = [];
  
  constructor(private pokemonService: PokemonService) {}

  closeModal() {
    this.close.emit();
  }

  // THIS IS THE MODIFIED searchPokemon METHOD
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
        const combinedResults = [...nameResults, ...typeResults];
        
        const uniqueResultsMap = new Map<string, any>();
        combinedResults.forEach(pokemon => {
          if (pokemon && pokemon.id && !uniqueResultsMap.has(pokemon.id)) {
            // Prepare Pokémon object for display, including calculated stats
            const processedPokemon = {
              ...pokemon,
              types: pokemon.types ? pokemon.types : (pokemon.type ? [pokemon.type] : []),
              // Call your calculation functions here and add them to the object
              // calculatedHp: this.calculateHp(pokemon.hp),
              // calculatedStrength: this.calculateStrength(pokemon.attacks),
              // calculatedWeakness: this.calculateWeakness(pokemon.weaknesses),
              // calculatedHappiness: this.calculateHappiness(pokemon) 
              // (ensure calculateHappiness has all data it needs)
            };
            uniqueResultsMap.set(pokemon.id, processedPokemon);
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

  // Keep your existing addPokemonToPokedex method or implement it
  addPokemonToPokedex(pokemon: any) {
    console.log('Add to Pokedex (implement this):', pokemon);
    // Emit event to parent component (AppComponent) to handle adding
    this.pokemonAdded.emit(pokemon); 
    // Optionally, filter this pokemon from future search results in this session
    // or close the modal
    // this.closeModal(); 
  }

  // TODO: ADD YOUR POKEMON STAT CALCULATION FUNCTIONS HERE
  // as per your README.md (calculateHp, calculateStrength, etc.)
  // Example:
  /*
  calculateHp(hpValue: string): number {
    const hp = parseInt(hpValue, 10);
    if (isNaN(hp) || hp < 0) return 0;
    return Math.min(100, hp);
  }

  calculateStrength(attacks: any[]): string {
    if (!attacks) return '0%';
    const strength = Math.min(100, attacks.length * 50);
    return `${strength}%`;
  }

  calculateWeakness(weaknesses: any[]): string {
    if (!weaknesses) return '0%';
    const weakness = Math.min(100, weaknesses.length * 100);
    return `${weakness}%`;
  }

  parseDamage(damageString: string): number {
    if (!damageString) return 0;
    const match = damageString.match(/\d+/);
    return match ? parseInt(match[0], 10) : 0;
  }

  calculateTotalDamage(attacks: any[]): number {
    if (!attacks) return 0;
    return attacks.reduce((total, attack) => total + this.parseDamage(attack.damage), 0);
  }

  calculateHappiness(pokemon: any): number {
    // Ensure all required base values are calculated first
    const hp = this.calculateHp(pokemon.hp);
    const totalDamage = this.calculateTotalDamage(pokemon.attacks);
    const weaknessPercentage = parseInt(this.calculateWeakness(pokemon.weaknesses).replace('%',''), 10);
    
    // ((HP / 10) + (Damage /10 ) + 10 - (Weakness)) / 5
    // Weakness in formula is 0-100, so if Weakness level is 100%, it means 1.
    // The formula in README: 10 - (Weakness). If weakness is 100%, this means 10 - 100 = -90.
    // Let's assume "Weakness" in the happiness formula refers to the count of weaknesses (0, 1, etc.)
    // or a scaled value. The example output has happiness 5.
    // Deoxys example: HP 110 (calc 100), 1 attack (strength 50%), 1 weakness (weakness 100%), damage 50.
    // Happiness: ((100/10) + (50/10) + 10 - (100? or 1?)) / 5 = 5
    // If weakness is 100 (meaning 100 points): (10 + 5 + 10 - 100) / 5 = -75 / 5 = -15 (doesn't match example)
    // If weakness is 1 (count): (10 + 5 + 10 - 1) / 5 = 24 / 5 = 4.8 ~ 5 (matches example if weakness count is used)
    // Let's assume "Weakness" in the formula refers to the number of weaknesses.
    const weaknessCount = pokemon.weaknesses ? pokemon.weaknesses.length : 0;
    
    let happiness = ((hp / 10) + (totalDamage / 10) + 10 - weaknessCount) / 5;
    happiness = Math.max(0, Math.round(happiness)); // Ensure non-negative and round
    return Math.min(5, happiness); // Max happiness is 5 in example.
  }
  */
}
