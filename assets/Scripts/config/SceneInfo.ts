
interface SceneInfo {
    name: string;
    time: number;  // 持续时间，单位s
    create_method: string;  // 生成鱼的方式  random--随机生成；order--按列表顺序循环生成；list--按列表顺序生成，生成完为止
    create_count: number;  // 每次生成数量
    create_interval: number;  // 生成间隔，单位s
    communities: Array<CommunityInfo>;  // 包含的鱼群信息
}

interface CommunityInfo {
    name: string;   // name跟鱼FishType的name配置同名
    type: string;   // alone, circle, line
    weight: number;  // 鱼生成的随机权重，只用于create_method = random
    count: number;  // 鱼群总数量
    extra: number;  // circle对应半径，line对应鱼生成间隔
}

export type { SceneInfo, CommunityInfo };

