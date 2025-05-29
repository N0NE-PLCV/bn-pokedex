import { Component } from '@angular/core';

const COLORS = {
  Psychic: '#f8a5c2',
  Fighting: '#f0932b',
  Fairy: '#c44569',
  Normal: '#f6e58d',
  Grass: '#badc58',
  Metal: '#95afc0',
  Water: '#3dc1d3',
  Lightning: '#f9ca24',
  Darkness: '#574b90',
  Colorless: '#FFF',
  Fire: '#eb4d4b',
};

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
})
export class AppComponent {
  isModalOpen: boolean = false;
  pokedexPokemon: any[] = []; // Stores Pokémon in the Pokedex

  openModal() {
    this.isModalOpen = true;
  }

  closeModal() {
    this.isModalOpen = false;
  }
  handleAddPokemon(pokemon: any) {
    // Add to Pokedex if not already present
    if (!this.pokedexPokemon.find(p => p.id === pokemon.id)) {
      // Recalculate stats to ensure consistency
      const calculatedHp = this.calculateHp(pokemon.hp);
      const calculatedStrength = this.calculateStrength(pokemon.attacks);
      const calculatedWeakness = this.calculateWeakness(pokemon.weaknesses);
      const totalDamage = this.calculateTotalDamage(pokemon.attacks);
      const calculatedHappiness = this.calculateHappiness(calculatedHp, totalDamage, pokemon.weaknesses);

      const pokemonWithStats = {
        ...pokemon,
        calculatedHp,
        calculatedStrength,
        calculatedWeakness,
        calculatedHappiness,
      };

      // Create a new array reference to ensure change detection is triggered
      this.pokedexPokemon = [...this.pokedexPokemon, pokemonWithStats];
    }
    // Optionally, you might want to close the modal after adding
    // this.closeModal();
  }

  handleRemovePokemon(pokemonToRemove: any) {
    // .filter() already returns a new array, so this is fine for change detection
    this.pokedexPokemon = this.pokedexPokemon.filter(p => p.id !== pokemonToRemove.id);
  }

  // Helper function to parse stat percentages (e.g., "50%" to 50)
  getStatPercentage(statString: string | undefined): number {
    if (!statString) return 0;
    const match = statString.match(/(\d+)/);
    return match ? parseInt(match[0], 10) : 0;
  }

  // Stat calculation methods
  private calculateHp(hp?: string): number { 
    return hp ? Math.min(100, parseInt(hp, 10) || 0) : 0; 
  }

  private calculateStrength(attacks?: any[]): string { 
    return attacks ? `${Math.min(100, attacks.length * 50)}%` : '0%'; 
  }

  private calculateWeakness(weaknesses?: any[]): string { 
    return weaknesses ? `${Math.min(100, weaknesses.length * 100)}%` : '0%'; 
  }

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