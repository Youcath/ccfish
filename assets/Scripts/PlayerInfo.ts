
interface PlayerInfo {
    playerNumber: number;
    nodes: Array<PlayerNodeConfig>;
}

interface PlayerNodeConfig {
    index: number;
    rotation: number;
    x: number;
    y: number;
}

export type { PlayerInfo, PlayerNodeConfig };