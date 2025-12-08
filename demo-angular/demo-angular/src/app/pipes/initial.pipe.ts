import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'initial',
  standalone: true,
})
export class InitialPipe implements PipeTransform {
  transform(value: string | null | undefined): string {
    if (!value || value.length === 0) return '?';
    return value.charAt(0).toUpperCase();
  }
}
