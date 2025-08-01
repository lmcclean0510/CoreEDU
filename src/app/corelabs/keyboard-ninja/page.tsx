
"use client";

import { useState, useEffect, useRef, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Keyboard, StopCircle, Trophy, Heart, Flame, CaseSensitive, Slice, Palette, Bomb } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Switch } from '@/components/ui/switch';
import { Header } from '@/components/layout/header';
import { Footer } from '@/components/layout/footer';

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

// --- Site Colors ---
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

// Accessible colors for keyboard rows
const ACCESSIBLE_COLORS = {
    topRow: 0x0072B2,    // A strong blue
    middleRow: 0xD55E00, // A reddish-orange
    bottomRow: 0x009E73, // A bluish-green
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
    const [lives, setLives] = useState(3);
    const [level, setLevel] = useState(1);
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
            if (!gameContainerRef.current) return;
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
                
                // Game mode states
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

                    // Reset and notify React of initial state
                    this.score = 0;
                    this.lives = 3;
                    this.level = 1;
                    this.lastSpawnTime = 0;
                    this.onStateUpdate({ score: this.score, lives: this.lives, level: this.level });
                }
                
                create() {
                    this.itemsGroup = this.physics.add.group();
                    this.input.keyboard.on('keydown', this.handleKeyDown, this);
                    this.input.keyboard.on('keyup', this.handleKeyUp, this);
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
                    let textColorHex = COLORS_HEX.foreground; // For underline graphics

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
                    
                    const children = [graphics, text];
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
                    } else { // Action Mode
                        mainTextContent = shortcutData.description;
                        if (this.showShortcutInAction) {
                            descTextContent = shortcutData.display;
                        }
                    }

                    const mainTextY = descTextContent ? -12 : 0;
                    const mainText = this.add.text(0, mainTextY, mainTextContent, { fontFamily: FONT_FAMILY, fontSize: '20px', color: COLORS.foreground, fontStyle: 'bold', align: 'center', padding: { top: 4, bottom: 4 } }).setOrigin(0.5);
                    
                    const children = [mainText];
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
                            
                            // To correctly hit an uppercase letter, shift MUST be pressed.
                            // To correctly hit a lowercase letter, shift must NOT be pressed.
                            // This correctly handles Caps Lock being on/off.
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
                        this.input.keyboard.off('keydown', this.handleKeyDown, this);
                        this.input.keyboard.off('keyup', this.handleKeyUp, this);
                        if (this.onGameOverCallback) {
                            this.onGameOverCallback(this.score);
                        }
                    }
                }
            }
            
            const config: Phaser.Types.Core.GameConfig = {
                type: Phaser.AUTO,
                width: gameContainerRef.current.clientWidth,
                height: gameContainerRef.current.clientHeight,
                parent: 'phaser-game-container',
                backgroundColor: COLORS.background,
                physics: {
                    default: 'arcade',
                    arcade: {
                        gravity: { y: 0 },
                    },
                },
                render: {
                    pixelArt: false,
                    antialias: true,
                    roundPixels: true,
                },
                resolution: window.devicePixelRatio || 1,
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
        // Cleanup on game over or when component unmounts
        if (gameState === 'gameOver' || gameState === 'start') {
            if (gameRef.current) {
                gameRef.current.destroy(true);
                gameRef.current = null;
            }
        }
    }, [gameState]);
    
    if (gameState === 'start') {
        return (
          <>
            <Header />
            <div className="w-full flex-1 flex flex-col items-center justify-center container mx-auto py-8 px-4">
                <div className="w-full max-w-3xl mx-auto">
                  <Card className="w-full text-center">
                    <CardHeader className="relative pb-6">
                      <CardTitle className="text-4xl font-bold font-headline flex items-center justify-center gap-3">
                        <Keyboard className="w-10 h-10 text-primary" />
                        Keyboard Ninja
                      </CardTitle>
                      <CardDescription className="text-lg mt-2">
                        Test your keyboard mastery. Select a game to begin.
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-8">
                        <div>
                          <Label className="text-base font-semibold mb-4 block">1. Choose Game Mode</Label>
                          <div className="flex justify-center flex-col sm:flex-row gap-4">
                            <Button 
                              variant={mainGameMode === 'shortcuts' ? 'default' : 'outline'} 
                              onClick={() => setMainGameMode('shortcuts')} 
                              className="flex-1 transition-transform hover:scale-[1.02]"
                            >
                               <Slice className="mr-2" /> Shortcut Slicer
                            </Button>
                            <Button 
                              variant={mainGameMode === 'typing' ? 'default' : 'outline'} 
                              onClick={() => setMainGameMode('typing')} 
                              className="flex-1 transition-transform hover:scale-[1.02]"
                            >
                               <CaseSensitive className="mr-2" /> Typing Ninja
                            </Button>
                          </div>
                          <p className="text-sm text-muted-foreground mt-3 min-h-[2.5rem] flex items-center justify-center px-4">
                            {mainGameMode === 'shortcuts' && 'Slice the correct keyboard shortcuts before they disappear!'}
                            {mainGameMode === 'typing' && 'Type the correct upper and lower case letters as they fly by!'}
                          </p>
                        </div>
                        
                        {mainGameMode === 'shortcuts' && (
                            <div className="flex flex-col items-center gap-4 p-4 border rounded-lg animate-fade-in">
                                <Label className="text-base font-semibold">Shortcut Slicer Options</Label>
                                <div className="flex flex-col sm:flex-row items-center gap-4">
                                    <div className="flex items-center space-x-2 rounded-md bg-muted p-1">
                                        <Button 
                                            variant={shortcutSubMode === 'shortcut' ? 'tab' : 'ghost'} 
                                            data-state={shortcutSubMode === 'shortcut' ? 'active' : 'inactive'}
                                            onClick={() => setShortcutSubMode('shortcut')} 
                                            className="flex-1 justify-center px-3 py-1.5"
                                        >
                                            Shortcut Mode
                                        </Button>
                                        <Button 
                                            variant={shortcutSubMode === 'action' ? 'tab' : 'ghost'} 
                                            data-state={shortcutSubMode === 'action' ? 'active' : 'inactive'}
                                            onClick={() => setShortcutSubMode('action')} 
                                            className="flex-1 justify-center px-3 py-1.5"
                                        >
                                            Action Mode
                                        </Button>
                                    </div>
                                    {shortcutSubMode === 'action' && (
                                        <div className="flex items-center space-x-3 pl-4 sm:pl-0 sm:border-l sm:ml-4 sm:pl-4 animate-fade-in">
                                            <Switch id="show-shortcut-toggle" checked={showShortcutInAction} onCheckedChange={setShowShortcutInAction} />
                                            <Label htmlFor="show-shortcut-toggle" className="text-sm cursor-pointer">Show Hint</Label>
                                        </div>
                                    )}
                                </div>
                                <p className="text-xs text-muted-foreground text-center">
                                    {shortcutSubMode === 'action' 
                                        ? 'In Action Mode, you see the action (e.g., "Copy") and must press the keys.' 
                                        : 'In Shortcut Mode, you see the keys (e.g., "Ctrl + C") and must press them.'
                                    }
                                </p>
                            </div>
                        )}

                        {mainGameMode === 'typing' && (
                           <div className="flex flex-col items-center gap-4 p-4 border rounded-lg animate-fade-in">
                                <Label className="text-base font-semibold">Typing Ninja Options</Label>
                                <div className="flex items-center justify-center space-x-3">
                                    <Switch id="color-code-toggle" checked={colorCodeRows} onCheckedChange={setColorCodeRows} />
                                    <Label htmlFor="color-code-toggle" className="text-sm cursor-pointer flex items-center gap-2">
                                      <Palette className="w-5 h-5 text-primary" />
                                      Color-Code Rows
                                    </Label>
                                </div>
                                {colorCodeRows && (
                                  <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2 text-xs animate-fade-in text-muted-foreground">
                                      <div className="flex items-center gap-2">
                                          <div className="w-3 h-3 rounded-full border" style={{ backgroundColor: '#0072B2' }} />
                                          <span>Top</span>
                                      </div>
                                      <div className="flex items-center gap-2">
                                          <div className="w-3 h-3 rounded-full border" style={{ backgroundColor: '#D55E00' }} />
                                          <span>Middle</span>
                                      </div>
                                      <div className="flex items-center gap-2">
                                          <div className="w-3 h-3 rounded-full border" style={{ backgroundColor: '#009E73' }} />
                                          <span>Bottom</span>
                                      </div>
                                  </div>
                                )}
                            </div>
                        )}

                        <div className="animate-fade-in">
                          <Label className="text-base font-semibold mb-4 block">
                             2. Choose Difficulty
                          </Label>
                          <div className="flex justify-center flex-col sm:flex-row gap-4">
                              <Button
                                  variant={difficulty === 'easy' ? 'default' : 'outline'}
                                  onClick={() => setDifficulty('easy')}
                                  className="flex-1"
                              >
                                  Easy
                              </Button>
                              <Button
                                  variant={difficulty === 'normal' ? 'default' : 'outline'}
                                  onClick={() => setDifficulty('normal')}
                                  className="flex-1"
                              >
                                  Normal
                              </Button>
                              <Button
                                  variant={difficulty === 'hard' ? 'default' : 'outline'}
                                  onClick={() => setDifficulty('hard')}
                                  className="flex-1"
                              >
                                  Hard
                              </Button>
                          </div>
                          <p className="text-sm text-muted-foreground mt-3 min-h-10 flex items-center justify-center px-4">
                            {difficulty === 'easy' && 'A relaxed pace with plenty of time to react. Perfect for learning the ropes!'}
                            {difficulty === 'normal' && 'The standard challenge. A good test of your skills without being overwhelming.'}
                            {difficulty === 'hard' && 'Maximum intensity! Any wrong move costs a life. Only for true ninjas!'}
                          </p>
                        </div>

                        <Button size="lg" onClick={startGame} className="mt-6">
                          Start Game
                        </Button>
                    </CardContent>
                  </Card>
                </div>
            </div>
            <Footer />
          </>
        );
    }
    
    if (gameState === 'gameOver') {
        return (
          <>
            <Header />
            <div className="w-full flex-1 flex flex-col items-center justify-center container mx-auto py-8 px-4">
                <Card className="w-full max-w-2xl text-center">
                    <CardHeader>
                        <CardTitle className="text-4xl sm:text-5xl font-bold font-headline flex items-center justify-center gap-3">
                            <Bomb className="w-10 h-10 text-destructive" />
                            Game Over!
                        </CardTitle>
                        <CardDescription>You ran out of lives!</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-center">
                            <div>
                                <p className="text-muted-foreground text-sm uppercase">Final Score</p>
                                <p className="text-5xl font-bold text-primary">{finalScore}</p>
                            </div>
                            <div>
                                <p className="text-muted-foreground text-sm uppercase">Level Reached</p>
                                <p className="text-5xl font-bold">{hudState.level}</p>
                            </div>
                        </div>
                        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mt-6">
                            <Button size="lg" onClick={startGame}>
                                Play Again
                            </Button>
                            <Button size="lg" onClick={handleChangeMode} variant="outline">
                                Change Mode
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            </div>
            <Footer />
          </>
        )
    }

    if (isGameActive || gameState === 'countdown') {
        return (
            <div className="w-full h-full flex flex-col gap-2 bg-background">
                <div className="flex flex-wrap justify-between items-center gap-2 p-1 bg-card rounded-lg border">
                    <div className="flex items-center gap-4">
                        <div className="flex items-center gap-1.5 text-sm font-bold">
                            <Trophy className="w-4 h-4 text-yellow-500" />
                            <span>Score: {hudState.score}</span>
                        </div>
                        <div className="flex items-center gap-1.5 text-sm font-bold">
                            <Heart className="w-4 h-4 text-destructive" />
                            <span>Lives: {hudState.lives}</span>
                        </div>
                        <div className="flex items-center gap-1.5 text-sm font-bold">
                            <Flame className="w-4 h-4 text-primary" />
                            <span>Level: {hudState.level}</span>
                        </div>
                    </div>
                    <Button onClick={() => handleGameOver(hudState.score)} variant="destructive" size="sm">
                      <StopCircle className="mr-1.5" />
                      End Game
                    </Button>
                </div>
                <div ref={gameContainerRef} className="relative flex-1 bg-card border-2 border-dashed border-primary rounded-lg overflow-hidden">
                    {gameState === 'countdown' && countdown !== null && (
                        <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-black/50 text-white">
                            <p className="text-9xl font-bold animate-pulse">{countdown}</p>
                        </div>
                    )}
                    <div id="phaser-game-container" key={`${mainGameMode}-${shortcutSubMode}-${difficulty}-${showShortcutInAction}-${colorCodeRows}-${gameState}`} className="w-full h-full" />
                </div>
            </div>
        );
    }
    
    return null;
}

    
