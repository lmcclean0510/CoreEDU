"use client";

import { useState, useEffect, useRef, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Keyboard, StopCircle, Trophy, Heart, Flame, CaseSensitive, Slice, Palette, LoaderCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Switch } from '@/components/ui/switch';
import { GameContainer } from '@/components/games/GameContainer';

const shortcutsList = [
    { keys: ['control', 'c'], display: 'Ctrl + C', description: 'Copy' },
    { keys: ['control', 'v'], display: 'Ctrl + V', description: 'Paste' },
    { keys: ['control', 'x'], display: 'Ctrl + X', description: 'Cut' },
    { keys: ['control', 'z'], display: 'Ctrl + Z', description: 'Undo' },
    { keys: ['control', 's'], display: 'Ctrl + S', description: 'Save' },
    { keys: ['control', 'a'], display: 'Ctrl + A', description: 'Select All' },
    { keys: ['alt', 'tab'], display: 'Alt + Tab', description: 'Switch Apps' },
    { keys: ['control', 'shift', 'escape'], display: 'Ctrl + Shift + Esc', description: 'Task Manager' },
    { keys: ['meta', 'c'], display: '⌘ + C', description: 'Copy' },
    { keys: ['meta', 'v'], display: '⌘ + V', description: 'Paste' },
    { keys: ['meta', 'x'], display: '⌘ + X', description: 'Cut' },
    { keys: ['meta', 'z'], display: '⌘ + Z', description: 'Undo' },
    { keys: ['meta', 's'], display: '⌘ + S', description: 'Save' },
    { keys: ['meta', 'a'], display: '⌘ + A', description: 'Select All' },
];

const typingCharacters = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');

const normalizeKey = (key: string): string => {
    const keyMap: { [key: string]: string } = {
        'Control': 'control', 'Alt': 'alt', 'Shift': 'shift', 'Meta': 'meta'
    };
    return keyMap[key] || key.toLowerCase();
};

const FONT_FAMILY = 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif';

const COLORS = {
    background: '#f0f0f0',
    primary: '#14b8a6',
    primaryDark: '#0f766e',
    foreground: '#0f172a',
    mutedForeground: '#64748b',
    card: '#ffffff',
    border: '#e2e8f0',
    destructive: '#ef4444',
    textOnColoredBg: '#ffffff',
};

const COLORS_HEX = {
    primary: 0x14b8a6,
    primaryDark: 0x0f766e,
    foreground: 0x0f172a,
    card: 0xffffff,
    border: 0xe2e8f0,
    destructive: 0xef4444,
    mutedForeground: 0x64748b,
    textOnColoredBg: 0xffffff,
};

const ACCESSIBLE_COLORS = {
    topRow: 0x0072B2,
    middleRow: 0xD55E00,
    bottomRow: 0x009E73,
};

const KEYBOARD_ROWS = {
    top: 'qwertyuiop'.split(''),
    middle: 'asdfghjkl'.split(''),
    bottom: 'zxcvbnm'.split(''),
};

export default function KeyboardNinjaPage() {
    const [gameState, setGameState] = useState<'start' | 'countdown' | 'playing' | 'gameOver'>('start');
    const [mainGameMode, setMainGameMode] = useState<'shortcuts' | 'typing'>('shortcuts');
    const [shortcutSubMode, setShortcutSubMode] = useState<'shortcut' | 'action'>('shortcut');
    const [difficulty, setDifficulty] = useState<'easy' | 'normal' | 'hard'>('normal');
    const [showShortcutInAction, setShowShortcutInAction] = useState(true);
    const [colorCodeRows, setColorCodeRows] = useState(true);
    const [score, setScore] = useState(0);
    const [finalScore, setFinalScore] = useState(0);
    const gameRef = useRef<any | null>(null);
    const gameContainerRef = useRef<HTMLDivElement>(null);
    const [countdown, setCountdown] = useState<number | null>(null);
    const [hudState, setHudState] = useState({ score: 0, lives: 3, level: 1 });
    
    const isGameActive = gameState === 'playing';

    const startGame = useCallback(() => {
        setHudState({ score: 0, lives: 3, level: 1 });
        setCountdown(3);
        setGameState('countdown');
    }, []);

    const handleGameOver = useCallback((score: number) => {
        setFinalScore(score);
        setGameState('gameOver');
    }, []);

    const handleChangeMode = () => {
        setGameState('start');
    };
    
    useEffect(() => {
        if (gameState === 'countdown' && countdown !== null && countdown > 0) {
            const timer = setTimeout(() => {
                setCountdown(c => (c ? c - 1 : null));
            }, 1000);
            return () => clearTimeout(timer);
        } else if (gameState === 'countdown' && (countdown === 0 || countdown === null)) {
            setGameState('playing');
        }
    }, [gameState, countdown]);

    useEffect(() => {
        let gameInstance: Phaser.Game | null = null;

        const initGame = async () => {
            const containerElement = gameContainerRef.current;
            if (!containerElement) return;
            const Phaser = await import('phaser');

            class GameScene extends Phaser.Scene {
                private score: number = 0;
                private lives: number = 3;
                private level: number = 1;
                private spawnRate: number = 2000;
                private maxOnScreen: number = 8;
                private lastSpawnTime: number = 0;
                
                private itemsGroup!: Phaser.Physics.Arcade.Group;
                private activeKeys: Set<string> = new Set();
                private isMac: boolean = false;
                
                private mainGameMode: 'shortcuts' | 'typing' = 'shortcuts';
                private shortcutSubMode: 'shortcut' | 'action' = 'shortcut';
                private difficulty: 'easy' | 'normal' | 'hard' = 'normal';
                private colorCodeRows: boolean = false;
                private showShortcutInAction: boolean = true;
                
                private availableShortcuts: any[] = [];
                
                private isGameActive: boolean = false;
                private onGameOverCallback!: (score: number) => void;
                private onStateUpdate!: (state: { score: number, lives: number, level: number }) => void;

                constructor() {
                    super({ key: 'GameScene' });
                }

                init(data: { 
                    mainGameMode: 'shortcuts' | 'typing',
                    shortcutSubMode: 'shortcut' | 'action',
                    difficulty: 'easy' | 'normal' | 'hard',
                    showShortcutInAction: boolean,
                    colorCodeRows: boolean,
                    onGameOver: (score: number) => void,
                    onStateUpdate: (state: { score: number, lives: number, level: number }) => void,
                }) {
                    this.activeKeys.clear();
                    this.isGameActive = true;

                    this.mainGameMode = data.mainGameMode || 'shortcuts';
                    this.shortcutSubMode = data.shortcutSubMode || 'shortcut';
                    this.difficulty = data.difficulty || 'normal';
                    this.showShortcutInAction = data.showShortcutInAction;
                    this.colorCodeRows = data.colorCodeRows;
                    this.onGameOverCallback = data.onGameOver;
                    this.onStateUpdate = data.onStateUpdate;
                    
                    switch (this.difficulty) {
                        case 'easy':
                            this.maxOnScreen = 4;
                            this.spawnRate = 2500;
                            break;
                        case 'normal':
                            this.maxOnScreen = 8;
                            this.spawnRate = 2000;
                            break;
                        case 'hard':
                            this.maxOnScreen = 12;
                            this.spawnRate = 1500;
                            break;
                    }

                    if (this.mainGameMode === 'shortcuts') {
                        this.isMac = typeof window !== 'undefined' && /Mac|iPod|iPhone|iPad/.test(navigator.platform);
                        this.availableShortcuts = shortcutsList.filter(sc => {
                            const isMacShortcut = sc.keys.includes('meta');
                            return this.isMac ? isMacShortcut : !isMacShortcut;
                        });
                    }

                    this.score = 0;
                    this.lives = 3;
                    this.level = 1;
                    this.lastSpawnTime = 0;
                    this.onStateUpdate({ score: this.score, lives: this.lives, level: this.level });
                }
                
                create() {
                    this.itemsGroup = this.physics.add.group();
                    const keyboard = this.input.keyboard;
                    if (!keyboard) {
                        return;
                    }
                    keyboard.on('keydown', this.handleKeyDown, this);
                    keyboard.on('keyup', this.handleKeyUp, this);
                }
                
                handleKeyDown(event: KeyboardEvent) {
                    if (!this.isGameActive) return;

                    if (this.mainGameMode === 'typing') {
                        this.checkTypingInput(event);
                        return;
                    }

                    const modifiers = new Set(['control', 'alt', 'shift', 'meta']);
                    const newKey = normalizeKey(event.key);

                    if (!modifiers.has(newKey)) {
                        event.preventDefault();
                        this.activeKeys.forEach(key => {
                            if (!modifiers.has(key)) {
                                this.activeKeys.delete(key);
                            }
                        });
                    }

                    this.activeKeys.add(newKey);
                    const matchFound = this.checkShortcutInput();
                    
                    if (!matchFound && this.difficulty === 'hard' && !modifiers.has(newKey)) {
                        this.loseLife();
                    }
                }
                
                handleKeyUp(event: KeyboardEvent) {
                    if (!this.isGameActive) return;
                    if (this.mainGameMode === 'typing') return;
                    
                    event.preventDefault();
                    const releasedKey = normalizeKey(event.key);
                    this.activeKeys.delete(releasedKey);
                }

                update(time: number) {
                    if (!this.isGameActive) return;

                    if (this.itemsGroup.getLength() < this.maxOnScreen && time > this.lastSpawnTime + this.spawnRate) {
                        this.spawnItem();
                        this.lastSpawnTime = time;
                    }

                    this.itemsGroup.getChildren().forEach(child => {
                        const item = child as Phaser.GameObjects.Container;
                        if (item.x < -300 || item.x > this.cameras.main.width + 300) {
                            this.loseLife();
                            item.destroy();
                        }
                    });
                }

                spawnItem() {
                    if (this.mainGameMode === 'shortcuts') {
                        this.spawnShortcut();
                    } else {
                        this.spawnTypingCharacter();
                    }
                }

                spawnTypingCharacter() {
                    const character = typingCharacters[Math.floor(Math.random() * typingCharacters.length)];
                    const side = Math.random() < 0.5 ? 'left' : 'right';

                    const x = side === 'left' ? -250 : this.cameras.main.width + 250;
                    const y = Phaser.Math.Between(100, this.cameras.main.height - 100);
                    const speed = (200 + (this.level * 40)) * (side === 'left' ? 1 : -1);
                    
                    const graphics = this.add.graphics();
                    let backgroundColor = COLORS_HEX.card;
                    let textColor = COLORS.foreground;
                    let textColorHex = COLORS_HEX.foreground;

                    if (this.colorCodeRows) {
                        textColor = COLORS.textOnColoredBg;
                        textColorHex = COLORS_HEX.textOnColoredBg;
                        const lowerChar = character.toLowerCase();
                        if (KEYBOARD_ROWS.top.includes(lowerChar)) {
                            backgroundColor = ACCESSIBLE_COLORS.topRow;
                        } else if (KEYBOARD_ROWS.middle.includes(lowerChar)) {
                            backgroundColor = ACCESSIBLE_COLORS.middleRow;
                        } else if (KEYBOARD_ROWS.bottom.includes(lowerChar)) {
                            backgroundColor = ACCESSIBLE_COLORS.bottomRow;
                        }
                    }

                    const text = this.add.text(0, 0, character, { fontFamily: FONT_FAMILY, fontSize: '32px', color: textColor, fontStyle: 'bold' }).setOrigin(0.5);
                    const boxWidth = text.width + 30;
                    const boxHeight = text.height + 20;
                    
                    graphics.fillStyle(backgroundColor, 1);
                    graphics.fillRoundedRect(-boxWidth/2, -boxHeight/2, boxWidth, boxHeight, 10);
                    graphics.lineStyle(2, COLORS_HEX.border, 1);
                    graphics.strokeRoundedRect(-boxWidth/2, -boxHeight/2, boxWidth, boxHeight, 10);
                    
                    const children: Phaser.GameObjects.GameObject[] = [graphics, text];
                    const isUpperCase = character >= 'A' && character <= 'Z';

                    if (isUpperCase) {
                        const underline = this.add.graphics();
                        const underlineWidth = text.width * 0.8;
                        const underlineY = (text.height / 2) + 2;
                        underline.lineStyle(2, textColorHex, 1);
                        underline.beginPath();
                        underline.moveTo(-underlineWidth / 2, underlineY);
                        underline.lineTo(underlineWidth / 2, underlineY);
                        underline.closePath();
                        underline.strokePath();
                        children.push(underline);
                    }

                    const container = this.add.container(x, y, children) as any;
                    this.itemsGroup.add(container);
                    container.setSize(boxWidth, boxHeight);
                    
                    container.targetKey = character;
                    container.body.velocity.x = speed;
                    container.body.allowGravity = false;
                }

                spawnShortcut() {
                    const shortcutData = this.availableShortcuts[Math.floor(Math.random() * this.availableShortcuts.length)];
                    const side = Math.random() < 0.5 ? 'left' : 'right';

                    const x = side === 'left' ? -250 : this.cameras.main.width + 250;
                    const y = Phaser.Math.Between(100, this.cameras.main.height - 100);
                    const speed = (200 + (this.level * 40)) * (side === 'left' ? 1 : -1);

                    let mainTextContent: string;
                    let descTextContent: string | null = null;

                    if (this.shortcutSubMode === 'shortcut') {
                        mainTextContent = shortcutData.display;
                        descTextContent = shortcutData.description;
                    } else {
                        mainTextContent = shortcutData.description;
                        if (this.showShortcutInAction) {
                            descTextContent = shortcutData.display;
                        }
                    }

                    const mainTextY = descTextContent ? -12 : 0;
                    const mainText = this.add.text(0, mainTextY, mainTextContent, { fontFamily: FONT_FAMILY, fontSize: '20px', color: COLORS.foreground, fontStyle: 'bold', align: 'center', padding: { top: 4, bottom: 4 } }).setOrigin(0.5);
                    
                    const children: Phaser.GameObjects.GameObject[] = [mainText];
                    let descText: Phaser.GameObjects.Text | null = null;
                    let boxWidth, boxHeight;
                    const padding = { x: 20, y: 15 };

                    if (descTextContent) {
                        descText = this.add.text(0, 15, descTextContent, { fontFamily: FONT_FAMILY, fontSize: '14px', color: COLORS.mutedForeground, fontStyle: 'normal' }).setOrigin(0.5);
                        children.push(descText);
                        boxWidth = Math.max(mainText.width, descText.width) + padding.x * 2;
                        boxHeight = mainText.height + descText.height + padding.y * 2 + 5;
                    } else {
                        boxWidth = mainText.width + padding.x * 2;
                        boxHeight = mainText.height + padding.y * 2;
                    }
                    
                    mainText.setX(Math.round(mainText.x));
                    mainText.setY(Math.round(mainText.y));
                    if (descText) {
                        descText.setX(Math.round(descText.x));
                        descText.setY(Math.round(descText.y));
                    }
                    
                    const graphics = this.add.graphics();
                    graphics.fillStyle(COLORS_HEX.card, 1);
                    graphics.fillRoundedRect(Math.round(-boxWidth/2), Math.round(-boxHeight/2), Math.round(boxWidth), Math.round(boxHeight), 10);
                    graphics.lineStyle(2, COLORS_HEX.border, 1);
                    graphics.strokeRoundedRect(Math.round(-boxWidth/2), Math.round(-boxHeight/2), Math.round(boxWidth), Math.round(boxHeight), 10);
                    children.unshift(graphics);
                    
                    const container = this.add.container(x, y, children) as any;
                    
                    this.itemsGroup.add(container);
                    container.setSize(boxWidth, boxHeight);
                    
                    container.keys = shortcutData.keys;
                    container.body.velocity.x = speed;
                    container.body.allowGravity = false;
                }

                checkTypingInput(event: KeyboardEvent) {
                    const pressedKey = event.key;
                    if (['Control', 'Alt', 'Shift', 'Meta', 'CapsLock', 'Tab'].includes(pressedKey)) return;
                    event.preventDefault();
                    
                    let matchFound = false;
                    for (const child of this.itemsGroup.getChildren()) {
                        const item = child as any;
                        if (!item.active || !item.targetKey) continue;

                        const targetKey = item.targetKey;
                        if (pressedKey === targetKey) {
                            const isTargetUpperCase = targetKey >= 'A' && targetKey <= 'Z';
                            
                            if ((isTargetUpperCase && event.shiftKey) || (!isTargetUpperCase && !event.shiftKey)) {
                                this.handleSuccessfulHit(item);
                                matchFound = true;
                                break;
                            }
                        }
                    }
                    
                    if (!matchFound && this.difficulty === 'hard') {
                        this.loseLife();
                    }
                }

                checkShortcutInput(): boolean {
                    const pressedKeys = Array.from(this.activeKeys).sort();

                    for (const child of this.itemsGroup.getChildren()) {
                        const shortcut = child as any;
                        if (!shortcut.active || !shortcut.keys) continue;

                        const shortcutKeys = [...shortcut.keys].sort();

                        if (shortcutKeys.join(',') === pressedKeys.join(',')) {
                            this.handleSuccessfulHit(shortcut);

                            const modifiers = new Set(['control', 'alt', 'shift', 'meta']);
                            this.activeKeys.forEach(key => {
                                if (!modifiers.has(key)) {
                                    this.activeKeys.delete(key);
                                }
                            });

                            return true;
                        }
                    }
                    return false;
                }

                handleSuccessfulHit(item: any) {
                    item.active = false;
                    this.score += 100;
                    
                    if (this.score >= this.level * 1000) {
                        this.level++;
                        this.spawnRate = Math.max(700, this.spawnRate - 150);
                    }
                    this.onStateUpdate({ score: this.score, lives: this.lives, level: this.level });

                    item.body.stop();
                    this.tweens.add({
                        targets: item,
                        scale: { from: 1, to: 1.15 },
                        y: item.y - 15,
                        angle: Math.random() > 0.5 ? 10 : -10,
                        alpha: 0,
                        ease: 'Power2',
                        duration: 300,
                        onComplete: () => {
                            item.destroy();
                        }
                    });
                }

                loseLife() {
                    if (!this.isGameActive) return;
                    this.lives--;
                    this.onStateUpdate({ score: this.score, lives: this.lives, level: this.level });

                    if (this.lives <= 0) {
                        this.isGameActive = false;
                        const keyboard = this.input.keyboard;
                        if (keyboard) {
                            keyboard.off('keydown', this.handleKeyDown, this);
                            keyboard.off('keyup', this.handleKeyUp, this);
                        }
                        if (this.onGameOverCallback) {
                            this.onGameOverCallback(this.score);
                        }
                    }
                }
            }
            
            const config: Phaser.Types.Core.GameConfig = {
                type: Phaser.AUTO,
                width: containerElement.clientWidth,
                height: containerElement.clientHeight,
                parent: 'phaser-game-container',
                backgroundColor: COLORS.background,
                physics: {
                    default: 'arcade',
                    arcade: {
                        gravity: { x: 0, y: 0 },
                    },
                },
                render: {
                    pixelArt: false,
                    antialias: true,
                    roundPixels: true,
                },
                scene: [GameScene],
            };

            gameInstance = new Phaser.Game(config);
            gameRef.current = gameInstance;
            gameInstance.scene.start('GameScene', { 
                mainGameMode,
                shortcutSubMode,
                difficulty,
                showShortcutInAction,
                colorCodeRows,
                onGameOver: handleGameOver,
                onStateUpdate: setHudState,
            });
        };

        if (gameState === 'playing' && !gameRef.current) {
            initGame();
        }

        const handleResize = () => {
            if (gameRef.current && gameContainerRef.current) {
                gameRef.current.scale.resize(gameContainerRef.current.clientWidth, gameContainerRef.current.clientHeight);
            }
        }
        
        if (gameState === 'playing') {
            window.addEventListener('resize', handleResize);
        }

        return () => {
            window.removeEventListener('resize', handleResize);
            if (gameRef.current) {
                gameRef.current.destroy(true);
                gameRef.current = null;
            }
        };
    }, [gameState, mainGameMode, shortcutSubMode, difficulty, showShortcutInAction, colorCodeRows, handleGameOver]);

    useEffect(() => {
        if (gameState === 'gameOver' || gameState === 'start') {
            if (gameRef.current) {
                gameRef.current.destroy(true);
                gameRef.current = null;
            }
        }
    }, [gameState]);
    
    if (gameState === 'start') {
        return (
          <Card className="max-w-3xl mx-auto">
            <CardHeader>
              <div className="flex items-center gap-3 mb-2">
                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                  <Keyboard className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <CardTitle className="text-2xl">Keyboard Ninja</CardTitle>
                  <CardDescription className="mt-1">
                    Test your keyboard mastery
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-3">
                <Label className="text-base font-semibold">Choose Game Mode</Label>
                <div className="grid grid-cols-2 gap-3">
                  <Button 
                    variant={mainGameMode === 'shortcuts' ? 'default' : 'outline'} 
                    onClick={() => setMainGameMode('shortcuts')} 
                    className="h-auto py-4 flex-col"
                  >
                    <Slice className="h-5 w-5 mb-2" />
                    <span className="text-sm font-medium">Shortcut Slicer</span>
                  </Button>
                  <Button 
                    variant={mainGameMode === 'typing' ? 'default' : 'outline'} 
                    onClick={() => setMainGameMode('typing')} 
                    className="h-auto py-4 flex-col"
                  >
                    <CaseSensitive className="h-5 w-5 mb-2" />
                    <span className="text-sm font-medium">Typing Ninja</span>
                  </Button>
                </div>
                <p className="text-sm text-muted-foreground text-center min-h-[2.5rem] flex items-center justify-center px-4">
                  {mainGameMode === 'shortcuts' && 'Slice keyboard shortcuts before they disappear!'}
                  {mainGameMode === 'typing' && 'Type the correct letters as they fly by!'}
                </p>
              </div>
              
              {mainGameMode === 'shortcuts' && (
                <div className="space-y-3 p-4 border rounded-lg bg-muted/30">
                  <Label className="text-base font-semibold">Shortcut Options</Label>
                  <div className="flex flex-col sm:flex-row items-center gap-4">
                    <div className="flex items-center space-x-2 rounded-md bg-muted p-1 w-full sm:w-auto">
                      <Button 
                        variant={shortcutSubMode === 'shortcut' ? 'default' : 'ghost'} 
                        onClick={() => setShortcutSubMode('shortcut')} 
                        className="flex-1 justify-center px-3 py-1.5"
                        size="sm"
                      >
                        Shortcut Mode
                      </Button>
                      <Button 
                        variant={shortcutSubMode === 'action' ? 'default' : 'ghost'} 
                        onClick={() => setShortcutSubMode('action')} 
                        className="flex-1 justify-center px-3 py-1.5"
                        size="sm"
                      >
                        Action Mode
                      </Button>
                    </div>
                    {shortcutSubMode === 'action' && (
                      <div className="flex items-center space-x-3">
                        <Switch 
                          id="show-hint" 
                          checked={showShortcutInAction} 
                          onCheckedChange={setShowShortcutInAction} 
                        />
                        <Label htmlFor="show-hint" className="text-sm cursor-pointer">
                          Show Hint
                        </Label>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {mainGameMode === 'typing' && (
                <div className="space-y-3 p-4 border rounded-lg bg-muted/30">
                  <Label className="text-base font-semibold">Typing Options</Label>
                  <div className="flex items-center space-x-3">
                    <Switch 
                      id="color-code" 
                      checked={colorCodeRows} 
                      onCheckedChange={setColorCodeRows} 
                    />
                    <Label htmlFor="color-code" className="text-sm cursor-pointer flex items-center gap-2">
                      <Palette className="w-4 h-4" />
                      Color-Code Rows
                    </Label>
                  </div>
                  {colorCodeRows && (
                    <div className="flex items-center gap-4 text-xs text-muted-foreground mt-2">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: '#0072B2' }} />
                        <span>Top</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: '#D55E00' }} />
                        <span>Middle</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: '#009E73' }} />
                        <span>Bottom</span>
                      </div>
                    </div>
                  )}
                </div>
              )}

              <div className="space-y-3">
                <Label className="text-base font-semibold">Difficulty</Label>
                <div className="grid grid-cols-3 gap-3">
                  <Button
                    variant={difficulty === 'easy' ? 'default' : 'outline'}
                    onClick={() => setDifficulty('easy')}
                    className="h-auto py-3"
                  >
                    Easy
                  </Button>
                  <Button
                    variant={difficulty === 'normal' ? 'default' : 'outline'}
                    onClick={() => setDifficulty('normal')}
                    className="h-auto py-3"
                  >
                    Normal
                  </Button>
                  <Button
                    variant={difficulty === 'hard' ? 'default' : 'outline'}
                    onClick={() => setDifficulty('hard')}
                    className="h-auto py-3"
                  >
                    Hard
                  </Button>
                </div>
                <p className="text-sm text-muted-foreground text-center">
                  {difficulty === 'easy' && 'Relaxed pace, perfect for learning'}
                  {difficulty === 'normal' && 'Standard challenge for most players'}
                  {difficulty === 'hard' && 'Maximum intensity - any wrong move costs a life!'}
                </p>
              </div>

              <Button size="lg" onClick={startGame} className="w-full">
                Start Game
              </Button>
            </CardContent>
          </Card>
        );
    }
    
    if (gameState === 'gameOver') {
        return (
          <Card className="max-w-2xl mx-auto">
            <CardHeader>
              <CardTitle className="text-3xl font-bold flex items-center justify-center gap-3 text-destructive">
                <Heart className="w-10 h-10" />
                Game Over!
              </CardTitle>
              <CardDescription className="text-center mt-2">
                You ran out of lives!
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-2 gap-6 text-center">
                <div>
                  <p className="text-sm text-muted-foreground uppercase mb-2">Final Score</p>
                  <p className="text-5xl font-bold text-primary">{finalScore}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground uppercase mb-2">Level Reached</p>
                  <p className="text-5xl font-bold">{hudState.level}</p>
                </div>
              </div>
              <div className="flex gap-3 justify-center">
                <Button size="lg" onClick={startGame}>
                  Play Again
                </Button>
                <Button size="lg" onClick={handleChangeMode} variant="outline">
                  Change Mode
                </Button>
              </div>
            </CardContent>
          </Card>
        )
    }

    if (isGameActive || gameState === 'countdown') {
        return (
            <GameContainer isPlaying={true}>
              <div className="w-full h-full flex flex-col gap-2 p-4">
                <div className="flex flex-wrap justify-between items-center gap-2 p-3 bg-card rounded-lg border shadow-sm">
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2 text-sm font-bold">
                      <Trophy className="w-4 h-4 text-yellow-500" />
                      <span>Score: {hudState.score}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm font-bold">
                      <Heart className="w-4 h-4 text-destructive" />
                      <span>Lives: {hudState.lives}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm font-bold">
                      <Flame className="w-4 h-4 text-primary" />
                      <span>Level: {hudState.level}</span>
                    </div>
                  </div>
                  <Button onClick={() => handleGameOver(hudState.score)} variant="destructive" size="sm">
                    <StopCircle className="mr-1.5" />
                    End Game
                  </Button>
                </div>
                <div ref={gameContainerRef} className="relative flex-1 bg-muted/30 border-2 border-dashed border-primary rounded-lg overflow-hidden">
                  {gameState === 'countdown' && countdown !== null && (
                    <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-black/50 text-white">
                      <p className="text-9xl font-bold animate-pulse">{countdown}</p>
                    </div>
                  )}
                  <div id="phaser-game-container" className="w-full h-full" />
                </div>
              </div>
            </GameContainer>
        );
    }
    
    return null;
}
