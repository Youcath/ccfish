import { _decorator, Component, Label, Node } from 'cc';
const { ccclass, property } = _decorator;

@ccclass('Statistics')
export class Statistics extends Component {
    totalScore: Node | undefined; // 当前总分记录节点
    totalCost: Node | undefined; // 打炮消耗总分记录节点
    totalFishScore: Node | undefined; // 鱼死亡奖励总分记录节点
    totalBonus: Node | undefined;   // 彩金奖励总分记录节点
    totalProfit: Node | undefined; // 当前总抽水分数记录节点
    totalProfitRate: Node | undefined; // 当前抽水率记录节点
    playerScores: Map<number, Node | undefined> = new Map();
    playerCosts: Map<number, Node | undefined> = new Map();
    playerFishScores: Map<number, Node | undefined> = new Map();
    playerBonuses: Map<number, Node | undefined> = new Map();
    playerProfits: Map<number, Node | undefined> = new Map();
    playerProfitRates: Map<number, Node | undefined> = new Map();

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

    needUpdate: boolean = false;

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
        }
    }

    protected update(dt: number): void {
        if (this.totalScore && this.needUpdate) {
            this.needUpdate = false;
            for (let i = 1; i <= 10; i++) {
                this.scoreUpdate(0, i);
                this.fishScoreUpdate(0, i);
                this.weaponCostUpdate(0, i);
                this.bonusScoreUpdate(0, i);
            }
        }
    }

    scoreUpdate(delta: number, playerIndex: number) {
        if (!this.playerScoreNums[playerIndex]) {
            this.playerScoreNums[playerIndex] = 0;
        }
        this.playerScoreNums[playerIndex] += delta;

        this.totalScoreNum += delta;

        this.updateScoreNodes(playerIndex);
        this.profitUpdate(playerIndex);
    }

    private updateScoreNodes(playerIndex: number) {
        if (this.totalScore) {
            this.totalScore.getComponent(Label).string = '当前分：' + this.totalScoreNum;
        } else {
            this.needUpdate = true;
        }
        if (this.playerScores[playerIndex]) {
            this.playerScores[playerIndex].getComponent(Label).string = '当前分：' + this.playerScoreNums[playerIndex];
        }
    }

    weaponCostUpdate(cost: number, playerIndex: number) {
        if (!this.playerCostNums[playerIndex]) {
            this.playerCostNums[playerIndex] = 0;
        }
        this.playerCostNums[playerIndex] += cost;

        this.totalCostNum += cost;

        this.updateCostNodes(playerIndex);
        this.profitUpdate(playerIndex);
    }

    private updateCostNodes(playerIndex: number) {
        if (this.totalCost) {
            this.totalCost.getComponent(Label).string = '消耗：' + this.totalCostNum;
        }
        if (this.playerCosts[playerIndex]) {
            this.playerCosts[playerIndex].getComponent(Label).string = '消耗：' + this.playerCostNums[playerIndex];
        }
    }

    fishScoreUpdate(score: number, playerIndex: number) {
        if (!this.playerFishScoreNums[playerIndex]) {
            this.playerFishScoreNums[playerIndex] = 0;
        }
        this.playerFishScoreNums[playerIndex] += score;

        this.totalFishScoreNum += score;

        this.updateFishNodes(playerIndex);
        this.profitUpdate(playerIndex);
    }

    private updateFishNodes(playerIndex: number) {
        if (this.totalFishScore) {
            this.totalFishScore.getComponent(Label).string = '鱼产出：' + this.totalFishScoreNum;
        }
        if (this.playerFishScores[playerIndex]) {
            this.playerFishScores[playerIndex].getComponent(Label).string = '鱼产出：' + this.playerFishScoreNums[playerIndex];
        }
    }

    bonusScoreUpdate(score: number, playerIndex: number) {
        if (!this.playerBonusNums[playerIndex]) {
            this.playerBonusNums[playerIndex] = 0;
        }
        this.playerBonusNums[playerIndex] += score;

        this.totalBonusNum += score;

        this.updateBonusNodes(playerIndex);
        this.profitUpdate(playerIndex);
    }

    private updateBonusNodes(playerIndex: number) {
        if (this.totalBonus) {
            this.totalBonus.getComponent(Label).string = '彩金：' + this.totalBonusNum;
        }
        if (this.playerBonuses[playerIndex]) {
            this.playerBonuses[playerIndex].getComponent(Label).string = '彩金：' + this.playerBonusNums[playerIndex];
        }
    }

    private profitUpdate(playerIndex: number) {
        this.playerProfitNums[playerIndex] = this.playerCostNums[playerIndex] - (this.playerFishScoreNums[playerIndex] + this.playerBonusNums[playerIndex]);

        this.totalProfitNum = this.totalCostNum - (this.totalFishScoreNum + this.totalBonusNum);

        
        this.profitRateUpdate(playerIndex);
    }

    private profitRateUpdate(playerIndex: number) {
        this.playerProfitRateNums[playerIndex] = this.playerProfitNums[playerIndex] / ( this.playerScoreNums[playerIndex] + this.playerCostNums[playerIndex] - (this.playerFishScoreNums[playerIndex] + this.playerBonusNums[playerIndex])) * 100;

        this.totalProfitRateNum = this.totalProfitNum / (this.totalScoreNum + this.totalCostNum - (this.totalFishScoreNum + this.totalBonusNum)) * 100;
        this.updateProfitNodes(playerIndex);
    }

    private updateProfitNodes(playerIndex: number) {
        if (this.totalProfit) {
            this.totalProfit.getComponent(Label).string = '抽水：' + this.totalProfitNum;
        }
        if (this.playerProfits[playerIndex]) {
            this.playerProfits[playerIndex].getComponent(Label).string = '抽水：' + this.playerProfitNums[playerIndex];
        }
        if (this.totalProfitRate) {
            this.totalProfitRate.getComponent(Label).string = '抽水率：' + this.totalProfitRateNum.toFixed(2) + '%';
        }
        if (this.playerProfitRates[playerIndex]) {
            this.playerProfitRates[playerIndex].getComponent(Label).string = '抽水率：' + this.playerProfitRateNums[playerIndex].toFixed(2) + '%';
        }
    }
}


