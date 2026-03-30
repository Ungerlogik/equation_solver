class Fraction {
    constructor(n, d = 1) {
        this.n = n;
        this.d = d;
        this.simplify();
    }

    simplify() {
        if (this.d === 0) throw new Error("Division durch 0");
        if (this.n === 0) { this.d = 1; return; }

        let a = Math.abs(this.n);
        let b = Math.abs(this.d);
        while (b) { let t = b; b = a % b; a = t; } // ggT berechnen

        this.n /= a;
        this.d /= a;

        // Minuszeichen immer in den Zähler
        if (this.d < 0) {
            this.n *= -1;
            this.d *= -1;
        }
    }

    add(f) { return new Fraction(this.n * f.d + f.n * this.d, this.d * f.d); }
    sub(f) { return new Fraction(this.n * f.d - f.n * this.d, this.d * f.d); }
    mul(f) { return new Fraction(this.n * f.n, this.d * f.d); }
    div(f) { return new Fraction(this.n * f.d, this.d * f.n); }

    isZero() { return this.n === 0; }
    isOne() { return this.n === 1 && this.d === 1; }
    isMinusOne() { return this.n === -1 && this.d === 1; }
    equals(f) { return this.n === f.n && this.d === f.d; }

    // Baut den KaTeX String für dieses Element
    toTeX(varName = '', isFirst = false) {
        if (this.isZero()) return '';

        let sign = this.n < 0 ? '-' : (isFirst ? '' : '+');
        let absN = Math.abs(this.n);
        let valStr = '';

        if (this.d === 1) {
            // Wenn 1 oder -1 und eine Variable da ist, schreibe "x" statt "1x"
            if (absN === 1 && varName !== '') valStr = varName;
            else valStr = absN + varName;
        } else {
            // Echter Bruch: \frac{n}{d}x
            valStr = `\\frac{${absN}}{${this.d}}${varName}`;
        }

        return `${sign} ${valStr}`.trim();
    }
}
