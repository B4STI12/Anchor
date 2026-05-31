import {
  Component, inject, signal, HostListener, OnInit, OnDestroy,
} from '@angular/core';
import { NgFor, NgIf } from '@angular/common';
import { CalculatorService, HistoryEntry } from '../../shared/services/calculator.service';

@Component({
  selector: 'app-calculator',
  standalone: true,
  imports: [NgFor, NgIf],
  template: `
    <div class="calc-overlay an-pop"
         [style.left.px]="posX()"
         [style.top.px]="posY()"
         (mousedown)="startDrag($event)">

      <!-- Header -->
      <div class="calc-header">
        <span class="calc-title">Calculator</span>
        <button class="sci-toggle" [class.on]="sci()" title="Scientific mode"
                (click)="sci.set(!sci())" (mousedown)="$event.stopPropagation()">f(x)</button>
        <button class="calc-close" title="Close" (click)="cs.hide()" (mousedown)="$event.stopPropagation()">×</button>
      </div>

      <!-- Display -->
      <div class="calc-display-area" (mousedown)="$event.stopPropagation()">
        <div class="calc-expr" [innerHTML]="expr() || '&nbsp;'"></div>
        <div class="calc-display">{{ display() }}</div>
      </div>

      <!-- Scientific row -->
      @if (sci()) {
        <div class="calc-grid sci-grid" (mousedown)="$event.stopPropagation()">
          <button class="calc-key fn-key" (click)="negate()">±</button>
          <button class="calc-key fn-key" (click)="percent()">%</button>
          <button class="calc-key fn-key" (click)="sqrt()">√</button>
          <button class="calc-key fn-key" (click)="square()">x²</button>
        </div>
      }

      <!-- Keypad -->
      <div class="calc-grid" (mousedown)="$event.stopPropagation()">
        <button class="calc-key span2 fn-key" (click)="clear()">C</button>
        <button class="calc-key fn-key" (click)="backspace()">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 4H8l-7 8 7 8h13a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2z"/><line x1="18" y1="9" x2="12" y2="15"/><line x1="12" y1="9" x2="18" y2="15"/></svg>
        </button>
        <button class="calc-key op-key" (click)="inputOp('/')">÷</button>

        <button class="calc-key" (click)="inputDigit('7')">7</button>
        <button class="calc-key" (click)="inputDigit('8')">8</button>
        <button class="calc-key" (click)="inputDigit('9')">9</button>
        <button class="calc-key op-key" (click)="inputOp('*')">×</button>

        <button class="calc-key" (click)="inputDigit('4')">4</button>
        <button class="calc-key" (click)="inputDigit('5')">5</button>
        <button class="calc-key" (click)="inputDigit('6')">6</button>
        <button class="calc-key op-key" (click)="inputOp('-')">−</button>

        <button class="calc-key" (click)="inputDigit('1')">1</button>
        <button class="calc-key" (click)="inputDigit('2')">2</button>
        <button class="calc-key" (click)="inputDigit('3')">3</button>
        <button class="calc-key op-key" (click)="inputOp('+')">+</button>

        <button class="calc-key span2" (click)="inputDigit('0')">0</button>
        <button class="calc-key" (click)="inputDot()">.</button>
        <button class="calc-key eq-key" (click)="equals()">=</button>
      </div>

      <!-- History -->
      <div class="calc-history" (mousedown)="$event.stopPropagation()">
        <div class="history-label">History</div>
        <div class="history-list">
          <div class="history-empty" *ngIf="history().length === 0">No calculations yet</div>
          <button
            class="calc-history-item"
            *ngFor="let h of history()"
            (click)="restoreResult(h.result)"
          >
            <span class="h-expr">{{ h.expr }}</span>
            <span class="h-result">= {{ h.result }}</span>
          </button>
        </div>
      </div>

    </div>
  `,
  styles: [`
    .calc-overlay {
      position: fixed;
      width: 264px;
      background: var(--panel);
      border: 1px solid var(--border);
      border-radius: 14px;
      box-shadow: 0 24px 64px rgba(0,0,0,.7), 0 0 0 1px rgba(255,255,255,.04);
      z-index: 500;
      user-select: none;
      overflow: hidden;
    }

    .calc-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 10px 14px 8px;
      cursor: grab;
      border-bottom: 1px solid var(--border);
    }
    .calc-header:active { cursor: grabbing; }
    .calc-title { font-size: 11px; font-weight: 600; color: var(--muted); letter-spacing: .4px; text-transform: uppercase; }

    .sci-toggle {
      margin-left: auto;
      height: 22px; padding: 0 8px; border-radius: 6px;
      border: 1px solid var(--border); background: transparent;
      color: var(--muted); cursor: pointer;
      font-size: 11px; font-weight: 600; font-family: var(--mono);
      transition: background .12s, color .12s, border-color .12s;
    }
    .sci-toggle:hover { background: var(--hover); color: var(--text); }
    .sci-toggle.on { background: rgba(37,99,235,.18); border-color: rgba(37,99,235,.4); color: var(--accent2); }

    .sci-grid {
      padding: 6px 10px 2px;
      border-bottom: 1px solid var(--border);
    }

    .calc-close {
      width: 22px; height: 22px;
      border-radius: 6px;
      border: none;
      background: transparent;
      color: var(--muted);
      cursor: pointer;
      font-size: 18px;
      line-height: 1;
      display: flex; align-items: center; justify-content: center;
    }
    .calc-close:hover { color: #f87171; background: rgba(248,113,113,.1); }

    .calc-display-area {
      padding: 12px 16px 6px;
      text-align: right;
    }
    .calc-expr { font-size: 12px; color: var(--muted); min-height: 17px; margin-bottom: 2px; }
    .calc-display {
      font-size: 30px;
      font-weight: 700;
      font-family: var(--mono);
      color: var(--text);
      letter-spacing: -.02em;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .calc-grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 5px;
      padding: 8px 10px 10px;
    }
    .calc-key {
      height: 44px;
      border-radius: 9px;
      border: 1px solid var(--border);
      background: var(--panel-2);
      color: var(--text);
      font-size: 15px;
      font-weight: 600;
      cursor: pointer;
      transition: background .1s;
      display: flex; align-items: center; justify-content: center;
    }
    .calc-key:hover { background: var(--hover); }
    .calc-key:active { background: rgba(37,99,235,.15); }
    .calc-key.span2 { grid-column: span 2; }
    .op-key  { color: var(--accent2); }
    .fn-key  { color: var(--muted); }
    .eq-key  { background: var(--accent); border-color: var(--accent); color: #fff; }
    .eq-key:hover { background: #1d4ed8; }

    .calc-history {
      border-top: 1px solid var(--border);
      max-height: 156px;
      overflow-y: auto;
    }
    .history-label {
      padding: 8px 14px 3px;
      font-size: 11px;
      font-weight: 600;
      color: var(--muted);
      letter-spacing: .4px;
      text-transform: uppercase;
    }
    .history-list { padding: 0 6px 6px; }
    .history-empty { padding: 6px 8px 8px; font-size: 12px; color: var(--muted); text-align: center; }
    .calc-history-item {
      display: flex;
      align-items: center;
      justify-content: space-between;
      width: 100%;
      padding: 5px 8px;
      border-radius: 7px;
      border: none;
      background: transparent;
      cursor: pointer;
      transition: background .1s;
      gap: 8px;
    }
    .calc-history-item:hover { background: var(--hover); }
    .h-expr { font-size: 11px; color: var(--muted); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; flex: 1; text-align: left; }
    .h-result { font-size: 13px; font-weight: 600; color: var(--text); font-family: var(--mono); white-space: nowrap; }
  `],
})
export class CalculatorComponent implements OnInit, OnDestroy {
  cs = inject(CalculatorService);

  private _display = signal('0');
  private _expr = signal('');
  private _pendingOp = signal<string | null>(null);
  private _operand = signal<number | null>(null);
  private _justCalc = signal(false);

  readonly display = this._display.asReadonly();
  readonly expr = this._expr.asReadonly();
  readonly history = this.cs.history;

  sci = signal(false);

  private _posX = signal(80);
  private _posY = signal(120);
  readonly posX = this._posX.asReadonly();
  readonly posY = this._posY.asReadonly();

  private dragging = false;
  private dragStart = { mx: 0, my: 0, ox: 0, oy: 0 };
  private onMove = (e: MouseEvent) => {
    if (!this.dragging) return;
    this._posX.set(this.dragStart.ox + e.clientX - this.dragStart.mx);
    this._posY.set(this.dragStart.oy + e.clientY - this.dragStart.my);
  };
  private onUp = () => { this.dragging = false; };

  ngOnInit(): void {
    document.addEventListener('mousemove', this.onMove);
    document.addEventListener('mouseup', this.onUp);
  }
  ngOnDestroy(): void {
    document.removeEventListener('mousemove', this.onMove);
    document.removeEventListener('mouseup', this.onUp);
  }

  startDrag(e: MouseEvent): void {
    const t = e.target as HTMLElement;
    if (t.classList.contains('calc-close') || t.closest('.calc-grid') || t.closest('.calc-history') || t.closest('.calc-display-area')) return;
    this.dragging = true;
    this.dragStart = { mx: e.clientX, my: e.clientY, ox: this._posX(), oy: this._posY() };
    e.preventDefault();
  }

  inputDigit(d: string): void {
    if (this._justCalc()) { this._display.set(d); this._justCalc.set(false); return; }
    const cur = this._display();
    this._display.set(cur === '0' ? d : cur.length > 14 ? cur : cur + d);
  }

  inputDot(): void {
    if (this._justCalc()) { this._display.set('0.'); this._justCalc.set(false); return; }
    if (!this._display().includes('.')) this._display.update(v => v + '.');
  }

  inputOp(op: string): void {
    const cur = parseFloat(this._display());
    if (this._pendingOp() !== null && !this._justCalc()) {
      const r = this.compute(this._operand()!, cur, this._pendingOp()!);
      this._display.set(this.fmt(r));
      this._operand.set(r);
    } else {
      this._operand.set(cur);
    }
    this._pendingOp.set(op);
    this._expr.set(`${this._operand()} ${this.opLabel(op)}`);
    this._justCalc.set(true);
  }

  equals(): void {
    const cur = parseFloat(this._display());
    const op = this._pendingOp();
    const operand = this._operand();
    if (op === null || operand === null) {
      this.pushHistory(`${cur}`, this.fmt(cur));
      return;
    }
    const result = this.compute(operand, cur, op);
    const rs = this.fmt(result);
    const exprStr = `${operand} ${this.opLabel(op)} ${cur}`;
    this._expr.set(exprStr);
    this._display.set(rs);
    this.pushHistory(exprStr, rs);
    this._pendingOp.set(null);
    this._operand.set(null);
    this._justCalc.set(true);
  }

  clear(): void {
    this._display.set('0');
    this._expr.set('');
    this._pendingOp.set(null);
    this._operand.set(null);
    this._justCalc.set(false);
  }

  backspace(): void {
    if (this._justCalc()) { this.clear(); return; }
    const cur = this._display();
    this._display.set(cur.length > 1 ? cur.slice(0, -1) : '0');
  }

  negate(): void {
    const v = parseFloat(this._display());
    if (!isNaN(v)) this._display.set(this.fmt(-v));
  }

  percent(): void {
    const v = parseFloat(this._display());
    if (isNaN(v)) return;
    const result = this._operand() !== null && this._pendingOp()
      ? (this._operand()! * v) / 100
      : v / 100;
    this._display.set(this.fmt(result));
    this._justCalc.set(true);
  }

  sqrt(): void {
    const v = parseFloat(this._display());
    if (isNaN(v) || v < 0) return;
    const result = Math.sqrt(v);
    const rs = this.fmt(result);
    this._expr.set(`√${v}`);
    this._display.set(rs);
    this.pushHistory(`√${v}`, rs);
    this._operand.set(null); this._pendingOp.set(null); this._justCalc.set(true);
  }

  square(): void {
    const v = parseFloat(this._display());
    if (isNaN(v)) return;
    const result = v * v;
    const rs = this.fmt(result);
    this._expr.set(`${v}²`);
    this._display.set(rs);
    this.pushHistory(`${v}²`, rs);
    this._operand.set(null); this._pendingOp.set(null); this._justCalc.set(true);
  }

  restoreResult(result: string): void {
    this._display.set(result);
    this._expr.set('');
    this._pendingOp.set(null);
    this._operand.set(null);
    this._justCalc.set(true);
  }

  @HostListener('document:keydown', ['$event'])
  onKey(e: KeyboardEvent): void {
    if (!this.cs.open()) return;
    const tag = (e.target as HTMLElement).tagName;
    if (tag === 'INPUT' || tag === 'TEXTAREA') return;
    if (e.key >= '0' && e.key <= '9') { this.inputDigit(e.key); return; }
    if (e.key === '.') { this.inputDot(); return; }
    if (e.key === '+') { this.inputOp('+'); return; }
    if (e.key === '-') { this.inputOp('-'); return; }
    if (e.key === '*') { this.inputOp('*'); return; }
    if (e.key === '/') { e.preventDefault(); this.inputOp('/'); return; }
    if (e.key === 'Enter' || e.key === '=') { this.equals(); return; }
    if (e.key === 'Backspace') { this.backspace(); return; }
    if (e.key === 'Escape') { this.cs.hide(); return; }
    if (e.key === 'c' || e.key === 'C') { this.clear(); return; }
  }

  private compute(a: number, b: number, op: string): number {
    switch (op) {
      case '+': return a + b;
      case '-': return a - b;
      case '*': return a * b;
      case '/': return b === 0 ? 0 : a / b;
      default:  return b;
    }
  }

  private opLabel(op: string): string {
    return ({ '+': '+', '-': '−', '*': '×', '/': '÷' } as any)[op] ?? op;
  }

  private fmt(n: number): string {
    const s = String(n);
    return s.length > 12 ? parseFloat(n.toPrecision(10)).toString() : s;
  }

  private pushHistory(expr: string, result: string): void {
    this.cs.pushHistory({ expr, result });
  }
}
