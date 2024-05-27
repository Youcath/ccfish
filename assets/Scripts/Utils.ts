import { _decorator, bezier, Component, Node, Vec3 } from 'cc';
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
}

