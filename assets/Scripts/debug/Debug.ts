import { _decorator, Button, Component, EditBox, EventHandler, instantiate, Label, Node } from 'cc';
import Game from '../Game';
import { CommunityInfo, SceneInfo } from '../config/SceneInfo';
import { Constant } from '../config/Constant';
const { ccclass, property } = _decorator;

@ccclass('Debug')
export class Debug extends Component {
    @property(Node) fishNameNode: Node;
    @property(Node) fishTypeNode: Node;
    @property(Node) fishCountNode: Node;
    @property(Node) fishExtraNode: Node;
    @property(Node) createButtonNode: Node;

    game: Game;

    init(game: Game) {
        this.game = game;
        this.node.parent = game.node;
        let layoutNode = this.node.getChildByName('Layout');
        if (layoutNode) {
            // 全体切换赌注
            let switchButton = layoutNode.getChildByName('Switch').getComponent(Button);
            const clickEventHandler = new EventHandler();
            clickEventHandler.target = game.node;
            clickEventHandler.component = 'Game';
            clickEventHandler.handler = 'switchButtonAll';
            switchButton.clickEvents.push(clickEventHandler);

            // 全体加100金币
            let goldButton = layoutNode.getChildByName('Gold').getComponent(Button);
            const clickEventHandler1 = new EventHandler();
            clickEventHandler1.target = game.node;
            clickEventHandler1.component = 'Game';
            clickEventHandler1.handler = 'cheatButtonAll';
            goldButton.clickEvents.push(clickEventHandler1);

            // 全体切换射击模式
            let modeButton = layoutNode.getChildByName('Mode').getComponent(Button);
            const clickEventHandler2 = new EventHandler();
            clickEventHandler2.target = game.node;
            clickEventHandler2.component = 'Game';
            clickEventHandler2.handler = 'switchModeButtonAll';
            modeButton.clickEvents.push(clickEventHandler2);
        }
        let otherNode = this.node.getChildByName('Others');
        if (otherNode) {
            let resetNode = otherNode.getChildByName('Reset');
            let resetButton = resetNode.getComponent(Button);
            const clickEventHandler1 = new EventHandler();
            clickEventHandler1.target = game.node;
            clickEventHandler1.component = 'Game';
            clickEventHandler1.handler = 'gameRestart';
            resetButton.clickEvents.push(clickEventHandler1);

            let moveBgNode = otherNode.getChildByName('MoveBg');
            let moveBgButton = moveBgNode.getComponent(Button);
            const clickEventHandler2 = new EventHandler();
            clickEventHandler2.target = game.node;
            clickEventHandler2.component = 'Game';
            clickEventHandler2.handler = 'gameMoveBg';
            moveBgButton.clickEvents.push(clickEventHandler2);
        }

        this.addPlayersDebug();
    }

    private addPlayersDebug() {
        for (let i = 1; i <= Constant.player_count; i++) {
            let playerDebugNode = instantiate(this.game.subDebugPrefab);

            playerDebugNode.getChildByName('Label').getComponent(Label).string = "玩家" + i;
            // 切换赌注
            let switchButton = playerDebugNode.getChildByName('Switch').getComponent(Button);
            const clickEventHandler = new EventHandler();
            clickEventHandler.target = this.game.node;
            clickEventHandler.component = 'Game';
            clickEventHandler.handler = 'switchButton';
            clickEventHandler.customEventData = "" + i;
            switchButton.clickEvents.push(clickEventHandler);

            // 加100金币
            let goldButton = playerDebugNode.getChildByName('Gold').getComponent(Button);
            const clickEventHandler1 = new EventHandler();
            clickEventHandler1.target = this.game.node;
            clickEventHandler1.component = 'Game';
            clickEventHandler1.handler = 'cheatButton';
            clickEventHandler1.customEventData = "" + i;
            goldButton.clickEvents.push(clickEventHandler1);

            // 切换射击模式
            let modeButton = playerDebugNode.getChildByName('Mode').getComponent(Button);
            const clickEventHandler2 = new EventHandler();
            clickEventHandler2.target = this.game.node;
            clickEventHandler2.component = 'Game';
            clickEventHandler2.handler = 'switchModeButton';
            clickEventHandler2.customEventData = "" + i;
            modeButton.clickEvents.push(clickEventHandler2);

            this.node.addChild(playerDebugNode);
        }
    }

    clearFishes() {
        this.game.fishManager.clearFish();
    }

    resumeFishes() {
        this.game.fishManager.resumeFish();
    }

    parseFishInfo(): CommunityInfo {
        const info: CommunityInfo = {name: "fish0", type: "alone", count: 1, extra: 1, weight: 0};
        let name = this.fishNameNode.getComponent(EditBox).string;
        if (!name) {
            name = 'fish0';
        }
        let fishInfo = this.game.fishManager.fishTypes.get(name);
        if (!fishInfo) {
            name = 'fish0';
            this.fishNameNode.getComponent(EditBox).string = name;
        }
        info.name = name;

        let type = this.fishTypeNode.getComponent(EditBox).string;
        if (type) {
            type = type.toLowerCase();
        } else {
            type = 'alone';
        }
        if (type != 'alone' && type != 'circle' && type != 'circle2' && type != 'line') {
            type = 'alone';
        }
        info.type = type;

        let count = this.fishCountNode.getComponent(EditBox).string;
        if (!count) {
            count = '1';
        }
        let num = Number.parseInt(count);
        if (num < 0 || num > 999) {
            num = 1;
        }
        info.count = num;

        let extra = this.fishExtraNode.getComponent(EditBox).string;
        if (!extra) {
            extra = '1';
        }
        let ex = Number.parseInt(extra);
        if (ex < 0 || ex > 999) {
            ex = 1;
        }
        info.extra = ex;

        return info;
    }

    createMoveFishes() {
        this.game.fishManager.createFishCommunity(this.parseFishInfo());
    }

    createStayFishes() {
        this.game.fishManager.createStayFish(this.parseFishInfo());
    }
}


