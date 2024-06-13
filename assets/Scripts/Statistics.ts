import { _decorator, Component, Label, Node } from 'cc';
const { ccclass, property } = _decorator;

@ccclass('Statistics')
export class Statistics extends Component {
    totalScore: Node; // 当前总分记录节点
    totalCost: Node; // 打炮消耗总分记录节点
    totalFishScore: Node; // 鱼死亡奖励总分记录节点
    totalBonus: Node;   // 彩金奖励总分记录节点
    totalProfit: Node; // 当前总抽水分数记录节点
    totalProfitRate: Node; // 当前抽水率记录节点
    playerScores: Map<number, Node> = new Map();
    playerCosts: Map<number, Node> = new Map();
    playerFishScores: Map<number, Node> = new Map();
    playerBonuses: Map<number, Node> = new Map();
    playerProfits: Map<number, Node> = new Map();
    playerProfitRates: Map<number, Node> = new Map();

    totalScoreNum = 0; // 当前总分数值
    totalCostNum = 0; // 打炮消耗总分数值
    totalFishScoreNum = 0; // 鱼死亡奖励总分数值
    totalBonusNum = 0;   // 彩金奖励总分数值
    totalProfitNum = 0; // 当前总抽水分数数值
    totalProfitRateNum = 0; // 当前抽水率数值
    playerScoreNums: Map<number, number> = new Map();
    playerCostNums: Map<number, number> = new Map();
    playerFishScoreNums: Map<number, number> = new Map();
    playerBonusNums: Map<number, number> = new Map();
    playerProfitNums: Map<number, number> = new Map();
    playerProfitRateNums: Map<number, number> = new Map();

    protected onLoad(): void {
        let layout = this.node.getChildByName('Layout');
        this.totalScore = layout.getChildByName('score');
        this.totalCost = layout.getChildByName('score-001');
        this.totalFishScore = layout.getChildByName('score-002');
        this.totalBonus = layout.getChildByName('score-003');
        this.totalProfit = layout.getChildByName('score-004');
        this.totalProfitRate = layout.getChildByName('score-005');

        for (let i = 1; i <= 10; i++) {
            let playerLayout = this.node.getChildByName('Layout-00' + i);
            this.playerScores[i]= playerLayout.getChildByName('score');
            this.playerCosts[i] = playerLayout.getChildByName('score-001');
            this.playerFishScores[i] = playerLayout.getChildByName('score-002');
            this.playerBonuses[i] = playerLayout.getChildByName('score-003');
            this.playerProfits[i] = playerLayout.getChildByName('score-004');
            this.playerProfitRates[i] = playerLayout.getChildByName('score-005');
            this.playerScoreNums[i] = 0;
            this.playerCostNums[i] = 0;
            this.playerFishScoreNums[i] = 0;
            this.playerBonusNums[i] = 0;
            this.playerProfitNums[i] = 0;
            this.playerProfitRateNums[i] = 0;
        }
    }

    scoreUpdate(delta: number, playerIndex: number) {
        this.playerScoreNums[playerIndex] += delta;

        this.totalScoreNum += delta;

        this.totalScore.getComponent(Label).string = '当前分：' + this.totalScoreNum;
        this.playerScores[playerIndex].getComponent(Label).string = '当前分：' + this.playerScoreNums[playerIndex];
        this.profitUpdate(playerIndex);
    }

    weaponCostUpdate(cost: number, playerIndex: number) {
        this.playerCostNums[playerIndex] += cost;

        this.totalCostNum += cost;

        this.totalCost.getComponent(Label).string = '消耗：' + this.totalCostNum;
        this.playerCosts[playerIndex].getComponent(Label).string = '消耗：' + this.playerCostNums[playerIndex];
        this.profitUpdate(playerIndex);
    }

    fishScoreUpdate(score: number, playerIndex: number) {
        this.playerFishScoreNums[playerIndex] += score;

        this.totalFishScoreNum += score;

        this.totalFishScore.getComponent(Label).string = '鱼产出：' + this.totalFishScoreNum;
        this.playerFishScores[playerIndex].getComponent(Label).string = '鱼产出：' + this.playerFishScoreNums[playerIndex];
        this.profitUpdate(playerIndex);
    }

    bonusScoreUpdate(score: number, playerIndex: number) {
        this.playerBonusNums[playerIndex] += score;

        this.totalBonusNum += score;

        this.totalBonus.getComponent(Label).string = '彩金：' + this.totalBonusNum;
        this.playerBonuses[playerIndex].getComponent(Label).string = '彩金：' + this.playerBonusNums[playerIndex];
        this.profitUpdate(playerIndex);
    }

    profitUpdate(playerIndex: number) {
        this.playerProfitNums[playerIndex] = this.playerCostNums[playerIndex] - (this.playerFishScoreNums[playerIndex] + this.playerBonusNums[playerIndex]);

        this.totalProfitNum = this.totalCostNum - (this.totalFishScoreNum + this.totalBonusNum);

        this.totalProfit.getComponent(Label).string = '抽水：' + this.totalProfitNum;
        this.playerProfits[playerIndex].getComponent(Label).string = '抽水：' + this.playerProfitNums[playerIndex];
        this.profitRateUpdate(playerIndex);
    }

    profitRateUpdate(playerIndex: number) {
        this.playerProfitRateNums[playerIndex] = this.playerProfitNums[playerIndex] / ( this.playerScoreNums[playerIndex] + this.playerCostNums[playerIndex] - (this.playerFishScoreNums[playerIndex] + this.playerBonusNums[playerIndex])) * 100;

        this.totalProfitRateNum = this.totalProfitNum / (this.totalScoreNum + this.totalCostNum - (this.totalFishScoreNum + this.totalBonusNum)) * 100;

        this.totalProfitRate.getComponent(Label).string = '抽水率：' + this.totalProfitRateNum + '%';
        this.playerProfitRates[playerIndex].getComponent(Label).string = '抽水率：' + this.playerProfitRateNums[playerIndex] + '%';
    }
}


