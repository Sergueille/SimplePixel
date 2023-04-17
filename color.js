class Color {
    static FromRGB(r, g, b, a = 1) {
        let res = new Color();
        res.r = r;
        res.g = g;
        res.b = b;
        res.a = a;
        return res;
    }
    static FromHSV(h, s, v, a = 1) {
        let res = new Color();
        res.SetHSV(h, s, v);
        res.a = a;
        return res;
    }
    static FromHex(hex) {
        let data = hex.trim().replace("#", "");
        if (data.length == 3) {
            data = data[0] + data[0] + data[1] + data[1] + data[2] + data[2];
        }
        else if (data.length == 4) {
            data = data[0] + data[0] + data[1] + data[1] + data[2] + data[2] + data[3] + data[3];
        }
        else if (data.length != 6 && data.length != 8)
            return null;
        let r = parseInt(data[0] + data[1], 16) / 255;
        let g = parseInt(data[2] + data[3], 16) / 255;
        let b = parseInt(data[4] + data[5], 16) / 255;
        let a = 1;
        if (data.length == 8) {
            a = parseInt(data[6] + data[7], 16) / 255;
        }
        if (isNaN(r) || isNaN(g) || isNaN(b) || isNaN(a))
            return null;
        return Color.FromRGB(r, g, b, a);
    }
    // if alpha is true: always include alpha
    // if alpha is false: include alpha only if alpha is not 1
    GetHex(alpha = false, withHash = true) {
        let rstring = Math.round(this.r * 255).toString(16).toUpperCase().padStart(2, "0");
        let gstring = Math.round(this.g * 255).toString(16).toUpperCase().padStart(2, "0");
        let bstring = Math.round(this.b * 255).toString(16).toUpperCase().padStart(2, "0");
        let hash = withHash ? "#" : "";
        let res = hash + rstring + gstring + bstring;
        let includeAlpha = alpha || this.a < 0.99;
        if (includeAlpha) {
            let astring = Math.round(this.a * 255).toString(16).toUpperCase().padStart(2, "0");
            res += astring;
        }
        return res;
    }
    GetH() {
        let c = this.GetHSVConvertValues();
        if (c.delta == 0) {
            return 0;
        }
        else if (c.cmax == this.r) {
            return (1 / 6) * ((((this.g - this.b) / c.delta) + 6) % 6);
        }
        else if (c.cmax == this.g) {
            return (1 / 6) * (((this.b - this.r) / c.delta) + 2);
        }
        else if (c.cmax == this.b) {
            return (1 / 6) * (((this.r - this.g) / c.delta) + 4);
        }
        return 0;
    }
    GetS() {
        let c = this.GetHSVConvertValues();
        if (c.cmax == 0)
            return 0;
        return c.delta / c.cmax;
    }
    GetV() {
        return Math.max(this.r, this.g, this.b);
    }
    SetHSV(h, s, v) {
        let c = v * s;
        let x = c * (1 - Math.abs(((h * 6) % 2) - 1));
        let m = v - c;
        let h6 = h * 6;
        if (h6 < 1) {
            this.r = c;
            this.g = x;
            this.b = 0;
        }
        else if (h6 < 2) {
            this.r = x;
            this.g = c;
            this.b = 0;
        }
        else if (h6 < 3) {
            this.r = 0;
            this.g = c;
            this.b = x;
        }
        else if (h6 < 4) {
            this.r = 0;
            this.g = x;
            this.b = c;
        }
        else if (h6 < 5) {
            this.r = x;
            this.g = 0;
            this.b = c;
        }
        else {
            this.r = c;
            this.g = 0;
            this.b = x;
        }
        this.r += m;
        this.g += m;
        this.b += m;
        return this;
    }
    SetH(h) {
        this.SetHSV(h, this.GetS(), this.GetV());
        return this;
    }
    SetS(s) {
        this.SetHSV(this.GetH(), s, this.GetV());
        return this;
    }
    SetV(v) {
        this.SetHSV(this.GetH(), this.GetS(), v);
        return this;
    }
    Copy() {
        return Color.FromRGB(this.r, this.g, this.b, this.a);
    }
    Mult(x) {
        let c = this.Copy();
        c.r *= x;
        c.g *= x;
        c.b *= x;
        return c;
    }
    BlendWith(other, fac = 0.5) {
        let get = (a, b) => a * fac + b * (1 - fac);
        return Color.FromRGB(get(this.r, other.r), get(this.g, other.g), get(this.b, other.b), get(this.a, other.a));
    }
    AlphaBlendWith(behind) {
        let res = this.BlendWith(behind, this.a);
        res.a = 1;
        return res;
    }
    Equals(other, tolerance = 0.0005) {
        return Math.abs(this.r - other.r) + Math.abs(this.b - other.b) + Math.abs(this.g - other.g) + Math.abs(this.a - other.a) < tolerance;
    }
    GetHSVConvertValues() {
        let cmax = Math.max(this.r, this.g, this.b);
        let cmin = Math.min(this.r, this.g, this.b);
        return {
            cmax: cmax,
            cmin: cmin,
            delta: cmax - cmin,
        };
    }
}
//# sourceMappingURL=color.js.map