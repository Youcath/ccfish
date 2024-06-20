import { _decorator, Node } from 'cc';
import Fish from '../Fish';
const { ccclass, property } = _decorator;

/**
 * TreeMap，values的排序为捕获概率由低到高
 */
@ccclass('TreeMapForFish')
export class TreeMapForFish {
    private map: Map<string, Node>;
    private sortedKeys: string[];
    private readonly comparation = (a, b) => {
        const valueA = this.map.get(a);
        const valueB = this.map.get(b);

        const fish1 = valueA.getComponent(Fish);
        const fish2 = valueB.getComponent(Fish);
        return fish1.gotRate > fish2.gotRate ? 1 : fish1.gotRate < fish2.gotRate ? -1 : 0;
    };

    constructor() {
        this.map = new Map<string, Node>();
        this.sortedKeys = [];
    }

    public length() {
        return this.map.size;
    }

    public set(value: Node): void {
        const fish = value.getComponent(Fish);
        this.map.set(fish._uuid, value);
        this.sortedKeys = Array.from(this.map.keys()).sort(this.comparation);
    }

    public sets(values: Array<Node>) {
        values.forEach((v) => {
            const fish = v.getComponent(Fish);
            this.map.set(fish._uuid, v);
        });
        this.sortedKeys = Array.from(this.map.keys()).sort(this.comparation);
    }

    public get(key: string): Node | undefined {
        return this.map.get(key);
    }

    public delete(key: string): void {
        this.map.delete(key);
        this.sortedKeys = this.sortedKeys.filter((k) => k !== key);
    }

    public clear(): void {
        this.map.clear();
        this.sortedKeys = [];
    }

    public keys(): string[] {
        return this.sortedKeys;
    }

    public values(): Node[] {
        return this.sortedKeys.map((key) => this.map.get(key) as Node);
    }
}


