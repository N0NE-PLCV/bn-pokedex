import { Component, EventEmitter, Input, Output } from '@angular/core';
import { PokemonService } from '../service/pokemon.service';

@Component({
  selector: 'app-modal',
  templateUrl: './modal.component.html',
  styleUrls: ['./modal.component.scss']
})



export class ModalComponent {
  @Input() isOpen: boolean = false;
  @Output() close = new EventEmitter<void>();

  closeModal() {
    this.close.emit();
  }

  searchText='';
  pokemonList: any[] = [];
  
  constructor(private pokemonService: PokemonService) {}

  searchPokemon() {
    const name = this.searchText.trim();
    if (!name) return;

    this.pokemonService.getPokemonList(20, name).subscribe({
      next: (res) => {
        this.pokemonList = res.map((p) => ({
          ...p,
          types: p.types ? p.types : p.type ? [p.type] : [],
        }));
      },
      error: (err) => {
        console.error('Error fetching Pokémon:', err);
        this.pokemonList = [];
      },
    });
  }
}

