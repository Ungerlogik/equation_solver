class Side {
    constructor(v1Coeff, v2Coeff, constant) {
        this.v1 = new Fraction(v1Coeff);
        this.v2 = new Fraction(v2Coeff);
        this.c = new Fraction(constant);
    }

    applyOp(op, num, varType, var1Name, var2Name) {
        let f = new Fraction(num);
        if (op === '+') {
            if (varType !== '' && varType === var1Name) this.v1 = this.v1.add(f);
            else if (varType !== '' && varType === var2Name) this.v2 = this.v2.add(f);
            else if (varType === '') this.c = this.c.add(f);
        } else if (op === '-') {
            if (varType !== '' && varType === var1Name) this.v1 = this.v1.sub(f);
            else if (varType !== '' && varType === var2Name) this.v2 = this.v2.sub(f);
            else if (varType === '') this.c = this.c.sub(f);
        } else if (op === '*' || op === ':') {
            if (op === '*') {
                this.v1 = this.v1.mul(f); this.v2 = this.v2.mul(f); this.c = this.c.mul(f);
            } else {
                this.v1 = this.v1.div(f); this.v2 = this.v2.div(f); this.c = this.c.div(f);
            }
        }
    }

    toTeX(var1Name, var2Name) {
        let terms = [];
        if (!this.v1.isZero()) terms.push(this.v1.toTeX(var1Name, terms.length === 0));
        if (!this.v2.isZero()) terms.push(this.v2.toTeX(var2Name, terms.length === 0));
        if (!this.c.isZero()) terms.push(this.c.toTeX('', terms.length === 0));

        if (terms.length === 0) return "0";
        return terms.join(" ").replace(/^\+ /, '');
    }
}

class Equation {
    constructor(v1Name, v2Name, a, b, c, d) {
        this.v1Name = v1Name;
        this.v2Name = v2Name;
        this.left = new Side(a, 0, b);
        this.right = new Side(v2Name ? 0 : c, v2Name ? c : 0, d);
    }

    static fromText(text) {
        const parts = text.split('=');
        if (parts.length !== 2) throw new Error("Kein '=' in der Gleichung gefunden.");

        const vars = [...new Set(text.match(/[a-z]/gi))];
        const v1 = vars[0] || 'x';
        const v2 = vars[1] || '';

        const parseSide = (sideStr) => {
            let v1_sum = 0, v2_sum = 0, c_sum = 0;

            let cleanStr = sideStr.replace(/\s+/g, '');
            cleanStr = cleanStr.replace(/[–—−]/g, '-');

            if (!cleanStr.startsWith('+') && !cleanStr.startsWith('-')) cleanStr = '+' + cleanStr;

            const termRegex = /([+-])(\d*)([a-z]?)/gi;
            let match;
            while ((match = termRegex.exec(cleanStr)) !== null) {
                let sign = match[1] === '-' ? -1 : 1;
                let numStr = match[2];
                let varName = match[3];

                let val = (numStr === '') ? 1 : parseInt(numStr, 10);
                val *= sign;

                // KORREKTUR: varName darf nicht leer sein, um in einen Variablen-Eimer zu fallen!
                if (varName !== '' && varName === v1) v1_sum += val;
                else if (varName !== '' && varName === v2) v2_sum += val;
                else if (varName === '') c_sum += val;
            }
            return { v1: v1_sum, v2: v2_sum, c: c_sum };
        };

        const leftData = parseSide(parts[0]);
        const rightData = parseSide(parts[1]);

        let eq = new Equation(v1, v2, 0, 0, 0, 0);
        eq.left = new Side(leftData.v1, leftData.v2, leftData.c);
        eq.right = new Side(rightData.v1, rightData.v2, rightData.c);
        return eq;
    }

    getTeX() {
        return `${this.left.toTeX(this.v1Name, this.v2Name)} = ${this.right.toTeX(this.v1Name, this.v2Name)}`;
    }

    apply(inputStr) {
        inputStr = inputStr.replace(/\s+/g, '');
        inputStr = inputStr.replace(/[–—−]/g, '-');
        inputStr = inputStr.replace(/[×•]/g, '*');
        inputStr = inputStr.replace(/[÷]/g, ':');

        const regex = /^([+\-*:/])\(?(-?\d+)?([a-z])?\)?$/i;
        const match = inputStr.match(regex);

        if (!match) throw new Error(`Eingabe nicht erkannt bei: '${inputStr}'. Bitte Format wie '+3' oder '-2x' nutzen.`);

        let op = match[1];
        if (op === '/') op = ':';

        let numStr = match[2];
        let varType = match[3] || '';

        if ((op === ':' || op === '*') && varType !== '') {
            throw new Error("Teilen oder Multiplizieren mit Variablen ist hier nicht erlaubt!");
        }

        let num = 1;
        if (numStr !== undefined) {
            num = parseInt(numStr, 10);
        } else if (varType === '') {
            throw new Error("Bitte gib eine Zahl oder Variable ein.");
        }

        if (op === ':' && num === 0) throw new Error("Durch 0 darfst du nicht teilen!");
        if (op === '*' && num === 0) throw new Error("Mit 0 zu multiplizieren ist nicht erlaubt!");

        if (varType !== '' && varType !== this.v1Name && varType !== this.v2Name) {
            throw new Error(`Die Variable '${varType}' gibt es in dieser Gleichung nicht.`);
        }

        this.left.applyOp(op, num, varType, this.v1Name, this.v2Name);
        this.right.applyOp(op, num, varType, this.v1Name, this.v2Name);
    }

    isSolved() {
        const checkSolved = (sideA, sideB) => {
            if (sideA.v1.isOne() && sideA.v2.isZero() && sideA.c.isZero() && sideB.v1.isZero() && sideB.v2.isZero()) return true;
            if (this.v2Name !== '' && sideA.v2.isOne() && sideA.v1.isZero() && sideA.c.isZero() && sideB.v2.isZero()) return true;
            if (this.v2Name !== '' && sideA.v1.isOne() && sideA.v2.isZero() && sideA.c.isZero() && sideB.v1.isZero()) return true;
            return false;
        };
        return checkSolved(this.left, this.right) || checkSolved(this.right, this.left);
    }

    getSolutionTeX() {
        let v1_diff = this.left.v1.sub(this.right.v1);
        let v2_diff = this.left.v2.sub(this.right.v2);
        let c_diff = this.right.c.sub(this.left.c);

        if (this.v2Name === '') {
            let resC = c_diff.div(v1_diff);
            let valStr = resC.toTeX('', true);
            if (valStr === '') valStr = '0';
            return `${this.v1Name} = ${valStr}`;
        } else {
            let sols = [];
            if (!v1_diff.isZero()) {
                let resV2 = v2_diff.mul(new Fraction(-1)).div(v1_diff);
                let resC = c_diff.div(v1_diff);
                let terms = [];
                if (!resV2.isZero()) terms.push(resV2.toTeX(this.v2Name, terms.length === 0));
                if (!resC.isZero()) terms.push(resC.toTeX('', terms.length === 0));
                let str = terms.join(" ").replace(/^\+ /, '');
                if (str === '') str = '0';
                sols.push(`${this.v1Name} = ${str}`);
            }
            if (!v2_diff.isZero()) {
                let resV1 = v1_diff.mul(new Fraction(-1)).div(v2_diff);
                let resC = c_diff.div(v2_diff);
                let terms = [];
                if (!resV1.isZero()) terms.push(resV1.toTeX(this.v1Name, terms.length === 0));
                if (!resC.isZero()) terms.push(resC.toTeX('', terms.length === 0));
                let str = terms.join(" ").replace(/^\+ /, '');
                if (str === '') str = '0';
                sols.push(`${this.v2Name} = ${str}`);
            }
            return sols.join(` \\quad \\text{oder} \\quad `);
        }
    }
}
