import { _decorator, bezier, v3, Vec3 } from 'cc';
const { ccclass, property } = _decorator;

@ccclass('Utils')
export class Utils {

    static bezierCurve(t: number, p1: Vec3, cp1: Vec3, cp2: Vec3, p2: Vec3, out: Vec3) {
        out.x = bezier(p1.x, cp1.x, cp2.x, p2.x, t);
        out.y = bezier(p1.y, cp1.y, cp2.y, p2.y, t);
        out.z = bezier(p1.z, cp1.z, cp2.z, p2.z, t);
    }

    /**
     * 计算两个向量夹角的弧度值
     * @param a
     * @param b 
     * @returns 
     */
    static angle(a: Vec3, b: Vec3): number {
        const ta = a.normalize();
        const tb = b.normalize();

        let ra = Math.acos(ta.dot(tb));
        if (a.x * b.y - a.y * b.x > 0) {
            return -ra;
        } else {
            return ra;
        }
    }

    /**
     * 可视范围是x ∈（-640， 640），y ∈ （-360， 360）
     * 在x ∈（-900， 900），y ∈ （-600， 600）的外矩形框上，随机选择一个起点或终点
     * 
     * @returns 
     */
    static getOutPosition(): Vec3 {
        let n = Math.random() * 4;
        let x = 0;
        let y = 0
        if (n < 1) {
            y = 600;
            x = 1800 * Math.random() - 900;
        } else if (n < 2) {
            x = 900;
            y = 1200 * Math.random() - 600;
        } else if (n < 3) {
            y = -600;
            x = 1800 * Math.random() - 900;
        } else {
            x = -900;
            y = 1200 * Math.random() - 600;
        }
        return v3(x, y);
    }

    /**
     * 在范围x ∈（-600， 600），y ∈ （-320， 320），随机选择一个点
     * 
     * @returns 
     */
    static getInnerPosition(): Vec3 {
        let x = 0;
        let y = 0

        y = 640 * Math.random() - 320;
        x = 1200 * Math.random() - 600;

        return v3(x, y);
    }

    // x ∈ （0，1） 
    static easing(x: number): number {
        // 震动插值函数，震动4个周期，振幅逐渐趋于0
        return (1 - x) * Math.sin(x * 8 * Math.PI);
    }

    // 根据上限和下限，概率性选定值
    static getValueRandom(up: number, down: number): number {
        if (up == down) {
            return up;
        }

        return down + Math.random() * (up - down);
    }

    // 根据基础赔率和翻倍数，计算捕获率 (1-抽水率)/实际赔率
    static getGetRate(odds: number, multiple: number, profit: number): number {
        if (odds == 0 || multiple == 0) {
            return 1;
        }
        return (1 - profit) / (odds * multiple);
    }
}

