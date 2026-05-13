import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import ImageCapture from '../../../views/capture/ImageCapture';

vi.mock('../../../api/client', () => ({
  analyzeImage: vi.fn().mockResolvedValue({ data: { text: 'Extracted text', description: 'A document' } }),
}));
vi.mock('../../../store/noteStore', () => ({
  useNoteStore: vi.fn().mockReturnValue({ saveNote: vi.fn().mockResolvedValue({ id: 'new-id' }) }),
}));

describe('ImageCapture', () => {
  it('renders the drop zone in idle state', () => {
    render(<ImageCapture />);
    expect(screen.getByText('Drop an image or click to upload')).toBeDefined();
    expect(screen.getByText('PNG, JPG, WebP · max 10MB')).toBeDefined();
  });

  it('shows error for oversized file', () => {
    render(<ImageCapture />);
    const input = document.querySelector('input[type="file"]') as HTMLInputElement;
    const bigFile = new File([new ArrayBuffer(11 * 1024 * 1024)], 'big.png', { type: 'image/png' });
    Object.defineProperty(bigFile, 'size', { value: 11 * 1024 * 1024 });
    fireEvent.change(input, { target: { files: [bigFile] } });
    expect(screen.getByText('File must be under 10MB.')).toBeDefined();
  });

  it('shows error for unsupported file type', () => {
    render(<ImageCapture />);
    const input = document.querySelector('input[type="file"]') as HTMLInputElement;
    const badFile = new File(['data'], 'file.gif', { type: 'image/gif' });
    fireEvent.change(input, { target: { files: [badFile] } });
    expect(screen.getByText('Only PNG, JPG, and WebP files are accepted.')).toBeDefined();
  });
});
