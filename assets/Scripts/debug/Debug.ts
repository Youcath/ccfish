import { _decorator, Button, Component, EventHandler, instantiate, Label, Node } from 'cc';
import Game from '../Game';
import { MovingBg } from '../MovingBg';
import { Constant } from '../config/Constant';
const { ccclass, property } = _decorator;

@ccclass('Debug')
export class Debug extends Component {

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
}


