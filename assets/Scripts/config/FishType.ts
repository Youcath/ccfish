// 定义一个接口，用来对应json配置文件转成对象
interface FishType{
    name: string;
    oddsUp: number,  // 基础赔率上限
    oddsDown: number, // 基础赔率下限
    multipleUp: number, // 翻倍数上限
    multipleDown: number, // 翻倍数下限
    w: number;  // 碰撞宽
    h: number;  // 碰撞长
    x: number;  // 碰撞体针对图片的中心偏移
    y: number;
}

// 鱼的生命状态
enum FishState {
    alive,
    dying,  // 已经死亡但尸体还会参与动画，故要保留节点
    dead    // 已经死亡，需要销毁节点
}

export { FishState };
export type { FishType };