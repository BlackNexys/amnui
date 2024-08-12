export default class ChecksumService {
    static register: any = {};

    static get(s: string): string {
        if (!this.register[s]) {
            this.register[s] = this.create(s);
        }

        return this.register[s];
    }

    private static create(s: string): string {
        var chk = 0x12345678;
        var len = s.length;
        for (var i = 0; i < len; i++) {
            chk += s.charCodeAt(i) * (i + 1);
        }

        return (chk & 0xffffffff).toString(16);
    }
}
