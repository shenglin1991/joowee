import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { compressImageLocally, compressPdfLocally, ResizeMode } from './compression';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './app.html',
  styleUrl: './app.scss',
})
export class App {
  selectedFile: File | null = null;

  mode: ResizeMode = 'max';
  maxSizeKb: number | null = 500;
  percent: number | null = 70;

  originalSize = 0;
  compressedBlob: Blob | null = null;
  downloadUrl: string | null = null;
  downloadName = '';

  isProcessing = false;
  error: string | null = null;

  get isPdfSelected(): boolean {
    return this.selectedFile?.type === 'application/pdf';
  }

  originalSizeKb(): number {
    return this.toKb(this.originalSize);
  }

  compressedSizeKb(): number {
    return this.compressedBlob ? this.toKb(this.compressedBlob.size) : 0;
  }

  gainPercent(): number {
    if (!this.compressedBlob || !this.originalSize) return 0;
    const diff = this.originalSize - this.compressedBlob.size;
    return Math.round((diff / this.originalSize) * 100);
  }

  canCompress(): boolean {
    if (!this.selectedFile) return false;
    if (this.mode === 'max') return !!this.maxSizeKb && this.maxSizeKb > 0;
    return !!this.percent && this.percent > 0 && this.percent <= 100;
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0] ?? null;

    this.resetResult();

    this.selectedFile = file;
    this.originalSize = file ? file.size : 0;
  }

  async onCompress(): Promise<void> {
    if (!this.selectedFile || !this.canCompress() || this.isProcessing) return;

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

