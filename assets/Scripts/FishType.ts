// 定义一个接口，用来对应json配置文件转成对象
interface FishType{
    name: string;
    hp: number;
    gold: number;
    w: number;  // 碰撞宽
    h: number;  // 碰撞长
    x: number;  // 碰撞体针对图片的中心偏移
    y: number
}

// 鱼的生命状态
enum FishState {
    alive,
    dead
}

export { FishState };
export type { FishType };