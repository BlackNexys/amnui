export class FlexStyle {
    align?: string;
    justify?: string;
    direction ?: string;
    wrap?: string;
    self?: string;
    content?: string;
    inline?: Boolean;
    gap?: string;
    grow?: string;
    shrink?: string;
    basis?: string;
    order?: string;

    constructor(attrs: any) {
        this.inline = attrs.inline;
        this.align = attrs.align;
        this.justify = attrs.justify;
        this.direction = attrs.direction;
        this.wrap = attrs.wrap;
        this.self = attrs.self;
        this.content = attrs.content;
        this.gap = attrs.gap;
        this.grow = attrs.grow;
        this.shrink = attrs.shrink;
        this.basis = attrs.basis;
        this.order = attrs.order;
    }

    getStyle() {
        let style = "";
        if (this.inline) {
            style += "display: inline-flex;";
        }
        if (this.align) {
            style += `align-items: ${this.align};`;
        }
        if (this.justify) {
            style += `justify-content: ${this.justify};`;
        }
        if (this.direction) {
            style += `flex-direction: ${this.direction};`;
        }
        if (this.wrap) {
            style += `flex-wrap: ${this.wrap};`;
        }
        if (this.self) {
            style += `align-self: ${this.self};`;
        }
        if (this.content) {
            style += `align-content: ${this.content};`;
        }
        if (this.gap) {
            style += `gap: ${this.gap};`;
        }
        if (this.grow) {
            style += `flex-grow: ${this.grow};`;
        }
        if (this.shrink) {
            style += `flex-shrink: ${this.shrink};`;
        }
        if (this.basis) {
            style += `flex-basis: ${this.basis};`;
        }
        if (this.order) {
            style += `order: ${this.order};`;
        }
        return style;
    }
}

export default class FlexStyleClass {
    base: FlexStyle;
    xs: FlexStyle;
    sm: FlexStyle;
    md: FlexStyle;
    lg: FlexStyle;
    xl: FlexStyle; 
    
    constructor(attributes: any) {
        const base: any = {};
        const xs: any = {};
        const sm: any = {};
        const md: any = {};
        const lg: any = {};
        const xl: any = {};

        for (const attr of attributes) {
            if (attr.name.startsWith("xs-")) {
                xs[attr.name.slice(3)] = attr.value;
            } else if (attr.name.startsWith("sm-")) {
                sm[attr.name.slice(3)] = attr.value;
            } else if (attr.name.startsWith("md-")) {
                md[attr.name.slice(3)] = attr.value;
            } else if (attr.name.startsWith("lg-")) {
                lg[attr.name.slice(3)] = attr.value;
            } else if (attr.name.startsWith("xl-")) {
                xl[attr.name.slice(3)] = attr.value;
            } else {
                base[attr.name] = attr.value;
            }
        }

        this.base = new FlexStyle(base);
        this.xs = new FlexStyle(xs);
        this.sm = new FlexStyle(sm);
        this.md = new FlexStyle(md);
        this.lg = new FlexStyle(lg);
        this.xl = new FlexStyle(xl);
    }

    get style() : string {
        const rootStyle = getComputedStyle(document.documentElement);
        return `#root {
            display: flex;
            ${this.base.getStyle()}
            @media (min-width: ${rootStyle.getPropertyValue("--amnui-breakpoint-xs")}) {
                ${this.xs.getStyle()}
            }
            @media (min-width: ${rootStyle.getPropertyValue("--amnui-breakpoint-sm")}) {
                ${this.sm.getStyle()}
            }
            @media (min-width: ${rootStyle.getPropertyValue("--amnui-breakpoint-md")}) {
                ${this.md.getStyle()}
            }
            @media (min-width: ${rootStyle.getPropertyValue("--amnui-breakpoint-lg")}) {
                ${this.lg.getStyle()}
            }
            @media (min-width: ${rootStyle.getPropertyValue("--amnui-breakpoint-xl")}) {
                ${this.xl.getStyle()}
            }
        }`.replace(/\s+/g, "");
    }
}