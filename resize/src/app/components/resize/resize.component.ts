import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  compressImageLocally,
  compressPdfLocally,
  type ResizeMode,
} from '../../services/compression/compression.service';
import { type Nullable, isNonNull } from '../../utils/nullables';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './resize.component.html',
  styleUrl: './resize.component.scss',
})
export class ResizeComponent {
  selectedFile: Nullable<File> = null;

  mode: ResizeMode = 'max';
  maxSizeKb: Nullable<number> = 500;
  percent: Nullable<number> = 70;

  originalSize = 0;
  compressedBlob: Nullable<Blob> = null;
  downloadUrl: Nullable<string> = null;
  downloadName = '';

  isProcessing = false;
  error: Nullable<string> = null;

  get isPdfSelected(): boolean {
    return isNonNull(this.selectedFile) && this.selectedFile.type === 'application/pdf';
  }

  originalSizeKb(): number {
    return this.toKb(this.originalSize);
  }

  compressedSizeKb(): number {
    return isNonNull(this.compressedBlob) ? this.toKb(this.compressedBlob.size) : 0;
  }

  gainPercent(): number {
    if (!isNonNull(this.compressedBlob) || !this.originalSize) return 0;
    const diff = this.originalSize - this.compressedBlob.size;
    return Math.round((diff / this.originalSize) * 100);
  }

  canCompress(): boolean {
    if (!isNonNull(this.selectedFile)) return false;
    if (this.mode === 'max') return isNonNull(this.maxSizeKb) && this.maxSizeKb > 0;
    return isNonNull(this.percent) && this.percent > 0 && this.percent <= 100;
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0] ?? null;

    this.resetResult();

    this.selectedFile = file;
    this.originalSize = file ? file.size : 0;
  }

  async onCompress(): Promise<void> {
    if (!isNonNull(this.selectedFile) || !this.canCompress() || this.isProcessing) return;

    this.error = null;
    this.isProcessing = true;
    this.resetResult(false);

    try {
      const compressed = this.isPdfSelected
        ? await compressPdfLocally(this.selectedFile, this.mode, this.maxSizeKb, this.percent)
        : await compressImageLocally(this.selectedFile, this.mode, this.maxSizeKb, this.percent);

      this.compressedBlob = compressed;
      this.downloadName = this.buildDownloadName(this.selectedFile, this.isPdfSelected ? 'pdf' : 'jpg');
      this.downloadUrl = URL.createObjectURL(compressed);
    } catch (err) {
      this.error = 'Une erreur est survenue pendant la compression.';
      console.error(err);
    } finally {
      this.isProcessing = false;
    }
  }

  private resetResult(revokeUrl: boolean = true): void {
    this.error = null;
    this.compressedBlob = null;
    if (revokeUrl && this.downloadUrl) {
      URL.revokeObjectURL(this.downloadUrl);
      this.downloadUrl = null;
    }
    this.downloadName = '';
  }

  private toKb(bytes: number): number {
    return Math.round(bytes / 1024);
  }

  private buildDownloadName(file: File, extension: string): string {
    const dotIndex = file.name.lastIndexOf('.');
    const base = dotIndex > 0 ? file.name.substring(0, dotIndex) : file.name;
    return `${base}-compressed.${extension}`;
  }
}

