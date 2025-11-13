/**
 * Type definitions for jspdf-autotable
 */

declare module 'jspdf-autotable' {
  import { jsPDF } from 'jspdf';

  interface UserOptions {
    head?: any[][];
    body?: any[][];
    foot?: any[][];
    startY?: number;
    margin?: number | { top?: number; right?: number; bottom?: number; left?: number };
    styles?: any;
    headStyles?: any;
    bodyStyles?: any;
    footStyles?: any;
    alternateRowStyles?: any;
    columnStyles?: any;
    theme?: 'striped' | 'grid' | 'plain';
    didDrawPage?: (data: any) => void;
    didDrawCell?: (data: any) => void;
    willDrawCell?: (data: any) => void;
    didParseCell?: (data: any) => void;
    showHead?: 'everyPage' | 'firstPage' | 'never';
    showFoot?: 'everyPage' | 'lastPage' | 'never';
    tableWidth?: 'auto' | 'wrap' | number;
    cellWidth?: 'auto' | 'wrap' | number;
    pageBreak?: 'auto' | 'avoid' | 'always';
    rowPageBreak?: 'auto' | 'avoid';
    tableLineColor?: number | number[];
    tableLineWidth?: number;
  }

  global {
    interface jsPDF {
      autoTable: (options: UserOptions) => jsPDF;
      lastAutoTable?: {
        finalY: number;
      };
    }
  }

  export default function autoTable(doc: jsPDF, options: UserOptions): void;
}
