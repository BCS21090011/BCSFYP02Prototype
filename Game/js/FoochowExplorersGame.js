class Timer
{
    #TimerID;
    #StartTime;
    #ElapsedTime;

    constructor ()
    {
        // Times shown are all in milliseconds:
        this.#TimerID = null;
        this.#StartTime = 0;
        this.#ElapsedTime = 0;
    }

    StartTimer ()
    {
        // If Timer is not running:
        if (this.#TimerID === null)
        {
            this.#StartTime = Date.now() - this.#ElapsedTime;   // Timer will continue if paused.
            this.#TimerID = setInterval(() => {
                this.#ElapsedTime = Date.now() - this.#StartTime;
            }, 1000);   // Update elapsed time every seconds.
        }
    }

    PauseTimer ()
    {
        // If Timer is already running:
        if (this.#TimerID !== null)
        {
            clearInterval(this.#TimerID);
            this.#TimerID = null;
            this.#ElapsedTime += Date.now() - this.#StartTime;  // Keep start time.
        }
    }

    ZeroTimer ()
    {
        this.#ElapsedTime = 0;
    }

    StopTimer ()
    {
        this.PauseTimer();
        this.ZeroTimer();
    }

    RestartTimer ()
    {
        this.StopTimer();
        this.StartTimer();
    }

    ReadTimer ()
    {
        return this.#ElapsedTime;
    }

    FormatTime (milliseconds)
    {
        let retVal = "";
        let seconds = Math.floor(milliseconds / 1000);
        let minutes = Math.floor(seconds / 60);
        
        // If there is value for minutes:
        if (minutes > 0)
        {
            seconds %= 60;
            retVal += `${minutes} minutes and `;
        }

        retVal += `${seconds} seconds`;
        return retVal;
    }
}

/*
    Keys:
        F: Toggle full screen
        E: Exit game
        TAB: Toggle inventory
        I: Toggle instruction
*/

class GameScene extends Phaser.Scene
{
    // Phaser scene manager documentation: https://photonstorm.github.io/phaser3-docs/Phaser.Scenes.SceneManager.html

    // Flags:
    #enableFullScreenKey = true;
    #enableExitKey = true;
    #enableInventoryKey = true;
    #enableInstructionKey = true;
    #havePanel = true;

    static GameTimer = new Timer();

    static Container = document.querySelector("#Container");
    static ContainerOriSize = { Height: Container.style.height, Width: Container.style.width };

    static ItemDetailDisplayItemName = null;
    static ItemCollectedItemName = null;

    static LastScene = null;

    static InstructionShown = false;
    static ChestOpened = false;
    static GalDoorOpened = false;
    static LibDoorOpened = false;
    static MainDoorOpened = false;
    static LampTaken = false;
    static RubberTreeVisible = false;
    static StrawRiceBasketTaken = false;
    static PotTaken = false;
    static RiceJarTaken = false;
    static BowlTaken = false;
    static RubberKnifeTaken = false;
    static PlateTaken = false;
    static DogEaten = false;
    static LatexCollected = false;
    
    static TextInterfaceTitle = null;
    static TextInterfaceTexts = null;

    static Inventory = [];
    static GameItems = [
        {
            ItemName: "Lamp",
            ItemDisplayName: "Lamp",
            Collectable: true,
            ItemImgSource: "../../assets/Game/NoBGLamp.png",
            ItemInventoryImgSource: "../../assets/Game/Lamp.png",
            ItemDescription: "Lamp for rubber tapping.\nWorkers will collect rubber latex before the sun rises,\nthis is so that latex will drip longer before coagulating and sealing the cut, collecting more latex,\nthis lamp will provide light source for them to collect rubber latex."
        },
        {
            ItemName: "WNSStatue",
            Collectable: false,
            ItemImgSource: "../../assets/Game/NoBGWNSStatue.png"
        },
        {
            ItemName: "TV",
            Collectable: false,
            ItemImgSource: "../../assets/Game/NoBGTV.png"
        },
        {
            ItemName: "StrawRiceBasket",
            ItemDisplayName: "Straw Rice Basket",
            Collectable: true,
            ItemImgSource: "../../assets/Game/NoBGRicePouch.png",
            ItemInventoryImgSource: "../../assets/Game/RicePouch.png",
            ItemDescription: "This is a tool to cook rice."
        },
        {
            ItemName: "RubberMachine",
            Collectable: false,
            ItemImgSource: "../../assets/Game/NoBGRubberMachine.png",
            ItemInventoryImgSource: "../../assets/Game/RubberMachine.jpg"
        },
        {
            ItemName: "RiceJarWithGrainsAndHusk",
            ItemDisplayName: "Rice Jar with Grains and Husk",
            Collectable: true,
            ItemImgSource: "../../assets/Game/NoBGRiceJar.png",
            ItemInventoryImgSource: "../../assets/Game/RiceJar.png",
            ItemDescription: "This is used to store rice.\nHmmm...There are husks mixed with grains inside.\nHow can you remove the husks?\nFind an item in this area that can do so."
        },
        {
            ItemName: "RiceJarWithGrains",
            ItemDisplayName: "Rice Jar with Grains",
            Collectable: true,
            ItemImgSource: "../../assets/Game/NoBGRiceJar.png",
            ItemInventoryImgSource: "../../assets/Game/RiceJar.png",
            ItemDescription: "To store rice.\nThe husks were removed, but it is still grains,\nIt seems you need to process it to raw rice\nbefore it can be cooked."
        },
        {
            ItemName: "RiceJarWithRice",
            ItemDisplayName: "Rice Jar with Rice",
            Collectable: true,
            ItemImgSource: "../../assets/Game/NoBGRiceJar.png",
            ItemInventoryImgSource: "../../assets/Game/RiceJar.png",
            ItemDescription: "To store rice.\nCan be cooked, where can you cook it?"
        },
        {
            ItemName: "Rice",
            ItemDisplayName: "Rice",
            Collectable: true,
            ItemImgSource: "../../assets/Game/NoBGRice.png",
            ItemInventoryImgSource: "../../assets/Game/NoBGRice.png",
            ItemDescription: "You have successfully cook the rice!\nMaybe you can feed this to the dog to tame it.\nRemember... there's a key on its collar.\n:)"
        },
        {
            ItemName: "Pot",
            ItemDisplayName: "Pot",
            Collectable: true,
            ItemImgSource: "../../assets/Game/NoBGPots.png",
            ItemInventoryImgSource: "../../assets/Game/Pot.png",
            ItemDescription: "This utensil can be used to boil water or cook rice."
        },
        {
            ItemName: "Piano",
            Collectable: false,
            ItemImgSource: "../../assets/Game/NoBGPiano.png"
        },
        {
            ItemName: "PestleAndMortar",
            Collectable: false,
            ItemImgSource: "../../assets/Game/NoBGPAndM.png"
        },
        {
            ItemName: "MarketPic",
            Collectable: false,
            ItemImgSource: "../../assets/Game/NoBGPic2.png"
        },
        {
            ItemName: "KitchenPic",
            Collectable: false,
            ItemImgSource: "../../assets/Game/NoBGPic1.png"
        },
        {
            ItemName: "ClothShowCases",
            Collectable: false,
            ItemImgSource: "../../assets/Game/NoBGShowCase.png"
        },
        {
            ItemName: "Chest",
            Collectable: false,
            ItemImgSource: "../../assets/Game/NoBGChest.png"
        },
        {
            ItemName: "Blower",
            Collectable: false,
            ItemImgSource: "../../assets/Game/NoBGBlower.png",
            ItemInventoryImgSource: "../../assets/Game/Blower.jpg"
        },
        {
            ItemName: "Bowl",
            ItemDisplayName: "Bowl",
            Collectable: true,
            ItemImgSource: "../../assets/Game/NoBGBowl2.png",
            ItemInventoryImgSource: "../../assets/Game/NoBGBowl.png",
            ItemDescription: "This will be used to collect rubber latex dripping from the cuttings on the rubber tree."
        },
        {
            ItemName: "RubberKnife",
            ItemDisplayName: "Rubber Knife",
            Collectable: true,
            ItemImgSource: "../../assets/Game/NoBGRubberKnife.png",
            ItemInventoryImgSource: "../../assets/Game/NoBGRubberKnife.png",
            ItemDescription: "This tool is used for rubber tapping.\nThis knife is used to create cuttings on the rubber tree to collect rubber latex."
        },
        {
            ItemName: "RubberSheet",
            ItemDisplayName: "Rubber Sheet",
            Collectable: true,
            ItemImgSource: "../../assets/Game/NoBGRubberSheet.png",
            ItemInventoryImgSource: "../../assets/Game/NoBGRubberSheet.png",
            ItemDescription: "This can be sold to the markets and processed into different rubber products."
        },
        {
            ItemName: "Plate",
            ItemDisplayName: "Plate",
            Collectable: true,
            ItemImgSource: "../../assets/Game/NoBGPlate.png",
            ItemInventoryImgSource: "../../assets/Game/NoBGPlate.png",
            ItemDescription: "Utensil to hold foods. You can use it to hold the rice."
        },
        {
            ItemName: "BowlOfLatex",
            ItemDisplayName: "Bowl of Latex",
            Collectable: true,
            ItemImgSource: "../../assets/Game/NoBGBowlOfLatex.png",
            ItemInventoryImgSource: "../../assets/Game/NoBGBowlOfLatex.png",
            ItemDescription: "This can be processed to rubber sheet using rubber making machine."
        },
        {
            ItemName: "MainDoorKey",
            ItemDisplayName: "Main Door Key",
            Collectable: true,
            ItemImgSource: "../../assets/Game/Pngtreegray metal key element_4482178.png",
            ItemInventoryImgSource: "../../assets/Game/Pngtreegray metal key element_4482178.png",
            ItemDescription: "To unlock main door."
        },
        {
            ItemName: "BluePianoKey",
            Collectable: false,
            ItemImgSource: "../../assets/Game/NoBGBluePianoKey2.png"
        },
        {
            ItemName: "GreyPianoKey",
            Collectable: false,
            ItemImgSource: "../../assets/Game/NoBGGreyPianoKey2.png"
        },
        {
            ItemName: "BlackPianoKey",
            Collectable: false,
            ItemImgSource: "../../assets/Game/NoBGBlackPianoKeys2.png"
        },
        {
            ItemName: "LibKey",
            ItemDisplayName: "Library Key",
            Collectable: true,
            ItemImgSource: "../../assets/Game/LibKey.png",
            ItemInventoryImgSource: "../../assets/Game/LibKey.png",
            ItemDescription: "An old key to the library."
        }
    ];

    constructor (config, enableFullScreenKey=true, enableExitKey=true, enableInventoryKey=true, enableInstructionKey=true, havePanel=true)
    {
        super(config);

        this.Key = config.key;
        this.SceneType = "GameScene";
        this.#enableFullScreenKey = enableFullScreenKey;
        this.#enableExitKey = enableExitKey;
        this.#enableInventoryKey = enableInventoryKey;
        this.#enableInstructionKey = enableInstructionKey;
        this.#havePanel = havePanel;
        this.BG = undefined;
    }

    preload ()
    {
        if (this.#enableFullScreenKey === true)
        {
            this.PreloadFullScreenKey();
        }

        if (this.#enableExitKey === true)
        {
            this.PreloadExitKey();
        }

        if (this.#enableInventoryKey === true)
        {
            this.PreloadInventoryKey();
        }

        if (this.#enableInstructionKey === true)
        {
            this.PreloadInstructionKey();
        }

        if (this.#havePanel === true)
        {
            this.load.image("HomeIcon", "../../assets/Game/HomeIcon.png");
            this.load.image("FullScreenIcon", "../../assets/Game/FullScreenIcon.png");
            this.load.image("ShrinkScreenIcon", "../../assets/Game/ShrinkScreenIcon.png");
            this.load.image("InventoryIcon", "../../assets/Game/InventoryIcon.png");
            this.load.image("InstructionIcon", "../../assets/Game/InstructionIcon.png");
            this.load.image("MuteIcon", "../../assets/Game/Mute.png");
        }

        if (this.BG !== undefined)
        {
            this.load.image(this.BG.BGName, this.BG.BGImgSrc);
        }

        this.load.image("RightArrow", "../../assets/Game/RArrow3.png");
        this.load.image("LeftArrow", "../../assets/Game/LArrow3.png");
        this.load.image("UpArrow", "../../assets/Game/UArrow3.png");
        this.load.image("DownArrow", "../../assets/Game/DArrow3.png");

        this.load.audio("Walking", "../../assets/Game/Walk.mp3");
        this.load.audio("Bing", "../../assets/Game/Bing.mp3");

        this.Preload();
    }

    create ()
    {
        const gameViewHeight = this.game.config.height;
        const gameViewWidth = this.game.config.width;

        if (this.BG !== undefined)
        {
            this.BG.BGElement = this.add.image(gameViewWidth / 2, gameViewHeight / 2, this.BG.BGName).setDisplaySize(gameViewWidth, gameViewHeight);
        }

        if (this.#havePanel === true)
        {
            const panel = this.add.rectangle(0, 0, 800, 50, 0x6666ff).setOrigin(0, 0);

            this.CreateIcon(40, 25, "HomeIcon", () => this.ExitGame());
            this.CreateIcon(80, 25, "FullScreenIcon", () => this.ToggleFullScreen());
            this.CreateIcon(120, 25, "InventoryIcon", () => this.ToggleInventoryInterface());
            this.CreateIcon(160, 25, "InstructionIcon", () => this.ToggleInstructionInterface());
        }

        this.Create();
    }

    update ()
    {
        this.Update();
    }

    PreloadFullScreenKey ()
    {
        let keyF = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.F);
        keyF.on("down", () => this.ToggleFullScreen());
        
        let keyEsc = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ESC);
        keyEsc.on("down", () => this.ToggleFullScreen(false));
    }

    PreloadExitKey ()
    {
        let keyE = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.E);
        keyE.on("down", () => {
            this.ExitGame();
        });
    }

    PreloadInventoryKey ()
    {
        let keyTab = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.TAB);
        keyTab.on("down", () => this.ToggleInventoryInterface());
    }

    PreloadInstructionKey ()
    {
        let keyI = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.I);
        keyI.on("down", () => this.ToggleInstructionInterface(true));
    }

    static InitializeGameStates ()
    {
        GameScene.ItemDetailDisplayItemName = null;
        GameScene.ItemCollectedItemName = null;

        GameScene.LastScene = null;

        GameScene.InstructionShown = false;
        GameScene.ChestOpened = false;
        GameScene.GalDoorOpened = false;
        GameScene.LibDoorOpened = false;
        GameScene.MainDoorOpened = false;
        GameScene.LampTaken = false;
        GameScene.RubberTreeVisible = false;
        GameScene.StrawRiceBasketTaken = false;
        GameScene.PotTaken = false;
        GameScene.RiceJarTaken = false;
        GameScene.BowlTaken = false;
        GameScene.RubberKnifeTaken = false;
        GameScene.PlateTaken = false;
        GameScene.DogEaten = false;
        GameScene.LatexCollected = true;

        GameScene.TextInterfaceTitle = null;
        GameScene.TextInterfaceTexts = null;

        GameScene.Inventory = [];
        GameScene.GameTimer.StopTimer();
    }

    CloseAllGameInterfaces ()
    {
        const gameInterfaces = this.game.scene.getScenes(true)
            .filter(s => s.SceneType === "GameInterface");

        gameInterfaces.forEach(scene => this.ToggleInterface(scene.Key, false));
    }

    ToggleFullScreen (fullScreen=null)
    {
        let shouldNotFullScreen = this.scale.isFullscreen;

        if (fullScreen === true)
        {
            shouldNotFullScreen = false;
        }
        else if (fullScreen === false)
        {
            shouldNotFullScreen = true;
        }

        if (shouldNotFullScreen === true)
        {
            GameScene.Container.style.height = GameScene.ContainerOriSize.Height;
            GameScene.Container.style.width = GameScene.ContainerOriSize.Width;
            this.scale.stopFullscreen();
        }
        else if (shouldNotFullScreen === false)
        {
            GameScene.Container.style.height = "100vh";
            GameScene.Container.style.width = "100vw";
            this.scale.startFullscreen();
        }
    }

    ToggleInventoryInterface (open=null)
    {
        // Will only toggle when ItemDetailInterface is not running:
        if (this.IsSceneRunning("ItemDetailInterface") === false)
        {
            this.ToggleInterface("Inventory", open);
        }
    }

    ToggleItemDetailInterface (itemName=null)
    {
        // If itemName is null, close the ItemDetailInterface:
        if (itemName == null)
        {
            GameScene.ItemDetailDisplayItemName = null;
            this.ToggleInterface("ItemDetailInterface", false);
        }
        else
        {
            // Will only open the ItemDetailInterface of the item if no ItemDetailInterface is running:
            if (this.IsSceneRunning("ItemDetailInterface") === false)
            {
                if (GameScene.GetItemInfo(itemName) != null)
                {
                    GameScene.ItemDetailDisplayItemName = itemName;
                    this.ToggleInterface("ItemDetailInterface", true);
                }
            }
        }
    }

    ToggleItemCollectedInterface (itemName=null)
    {
        // If itemName is null, close the ItemCollectedInterface:
        if (itemName == null)
        {
            GameScene.ItemCollectedItemName = null;
            this.ToggleInterface("ItemCollectedInterface", false);
        }
        else
        {
            // Will only open the ItemCollectedInterface of the item if no ItemCollectedInterface is running:
            if (this.IsSceneRunning("ItemCollectedInterface") === false)
            {
                if (GameScene.GetItemInfo(itemName) != null)
                {
                    GameScene.ItemCollectedItemName = itemName;
                    this.ToggleInterface("ItemCollectedInterface", true);
                }
            }
        }
    }

    ToggleInstructionInterface (open=null)
    {
        this.ToggleInterface("InstructionInterface", open);
    }

    ToggleTextInterface (title=null, text=null)
    {
        return new Promise((resolve) => {
            GameScene.TextInterfaceTitle = title;
            GameScene.TextInterfaceTexts = text;

            if (text == null)
            {
                this.ToggleInterface("TextInterface", false);
                resolve();
            }
            else
            {
                this.ToggleInterface("TextInterface", true);
                const checker = setInterval(() => {
                    if (!this.scene.isActive("TextInterface"))
                    {
                        clearInterval(checker);
                        resolve();
                    }
                }, 100);
            }
        });
    }

    ToggleInterface (gameInterface, open=null)
    {
        let shouldClose = this.scene.isActive(gameInterface);    // this.scene.isActive(gameInterface) return true if the gameInterface is running.

        if (open === true)
        {
            shouldClose = false;
        }
        else if (open === false)
        {
            shouldClose = true;
        }

        if (shouldClose === true)
        {
            this.scene.stop(gameInterface); // Close gameInterface.
        }
        else if (shouldClose === false)
        {
            this.scene.launch(gameInterface);   // Open gameInterface (overlap with scene).
        }
    }

    GotoScene (scene, playSound=true)
    {
        if (this.IsAnyInterfaceRunning() === false) // Only goto new scene if no game interface is running.
        {
            // If playSound is boolean, it will either play or stop Walking sound:
            if (typeof(playSound) === "boolean")
            {
                this.PlaySound("Walking", playSound);
            }
            // If playSound is not boolean, it will play playSound:
            else
            {
                this.PlaySound(playSound);
            }

            this.input.setDefaultCursor("default");
            this.scene.start(scene); // Goto new another scene.
        }
    }

    PlaySound (playSound, play=true)
    {
        if (play === true)
        {
            this.sound.stopByKey(playSound);    // Stop playSound if it is already playing.
            this.sound.play(playSound);
        }
        else if (play === false)
        {
            this.sound.stopByKey(playSound);
        }
    }

    SetBackground (backgroundName, backgroundImgSrc)    // Should be called in constructor.
    {
        this.BG = {
            BGName: backgroundName,
            BGImgSrc: backgroundImgSrc,
            BGElement: undefined
        }
    }

    SetRightArrow (clickFunc, txt=null, offset=0)
    {
        const gameViewHeight = this.game.config.height;
        const gameViewWidth = this.game.config.width;
        
        const textOffset = 40;

        let x = gameViewWidth - 20;
        let y = (gameViewHeight / 2) + offset;

        if (y < 0 || y > gameViewHeight)
        {
            y = gameViewHeight / 2;
        }

        let textY = y - textOffset;

        if (textY < 0)
        {
            textY = y + textOffset;
        }

        const text = this.make.text({
            x: x,
            y: textY,
            padding: 8,
            text: txt,
            style: {
                fontSize: "16px",
                fontFamily: "Roboto",
                color: "#ffffff",
                backgroundColor: "#666666"
            }
        });
        text.setOrigin(1, 0.5);
        text.setVisible(false);

        const arrow = this.add.image(x, y, "RightArrow").setDisplaySize(40, 40)
            .setInteractive({ cursor: "pointer" })
            .on("pointerover", () => {
                this.input.setDefaultCursor("pointer");
                if (txt != null)
                {
                    text.setVisible(true);
                }
            })
            .on("pointerout", () => {
                this.input.setDefaultCursor("default");
                if (txt != null)
                {
                    text.setVisible(false);
                }
            })
            .on("pointerup", () => clickFunc());

        return arrow;
    }

    SetLeftArrow (clickFunc, txt=null, offset=0)
    {
        const gameViewHeight = this.game.config.height;
        const gameViewWidth = this.game.config.width;

        const textOffset = 40;

        let x = 20;
        let y = (gameViewHeight / 2) + offset;

        if (y < 0 || y > gameViewHeight)
        {
            y = gameViewHeight / 2;
        }

        let textY = y - textOffset;

        if (textY < 0)
        {
            textY = y + textOffset;
        }

        const text = this.make.text({
            x: x,
            y: textY,
            padding: 8,
            text: txt,
            style: {
                fontSize: "16px",
                fontFamily: "Roboto",
                color: "#ffffff",
                backgroundColor: "#666666"
            }
        });
        text.setOrigin(0, 0.5);
        text.setVisible(false);

        const arrow = this.add.image(x, y, "LeftArrow").setDisplaySize(40, 40)
            .setInteractive({ cursor: "pointer" })
            .on("pointerover", () => {
                this.input.setDefaultCursor("pointer");
                if (txt != null)
                {
                    text.setVisible(true);
                }
            })
            .on("pointerout", () => {
                this.input.setDefaultCursor("default");
                if (txt != null)
                {
                    text.setVisible(false);
                }
            })
            .on("pointerup", () => clickFunc());

        return arrow;
    }

    SetUpArrow (clickFunc, txt=null, offset=0)
    {
        const gameViewHeight = this.game.config.height;
        const gameViewWidth = this.game.config.width;

        let x = (gameViewWidth / 2) + offset;

        if (x < 0 || x > gameViewWidth)
        {
            x = gameViewWidth / 2;
        }

        const text = this.make.text({
            x: x,
            y: 125,
            padding: 8,
            text: txt,
            style: {
                fontSize: "16px",
                fontFamily: "Roboto",
                color: "#ffffff",
                backgroundColor: "#666666"
            }
        });
        text.setOrigin(0.5, 0);
        text.setVisible(false);

        const arrow = this.add.image(x, 85, "UpArrow").setDisplaySize(40, 40)
            .setInteractive({ cursor: "pointer" })
            .on("pointerover", () => {
                this.input.setDefaultCursor("pointer");
                if (txt != null)
                {
                    text.setVisible(true);
                }
            })
            .on("pointerout", () => {
                this.input.setDefaultCursor("default");
                if (txt != null)
                {
                    text.setVisible(false);
                }
            })
            .on("pointerup", () => clickFunc());

        return arrow;
    }

    SetDownArrow (clickFunc, txt=null, offset=0)
    {
        const gameViewHeight = this.game.config.height;
        const gameViewWidth = this.game.config.width;

        let x = (gameViewWidth / 2) + offset;

        if (x < 0 || x > gameViewWidth)
        {
            x = gameViewWidth / 2;
        }

        const text = this.make.text({
            x: x,
            y: gameViewHeight - 60,
            padding: 8,
            text: txt,
            style: {
                fontSize: "16px",
                fontFamily: "Roboto",
                color: "#ffffff",
                backgroundColor: "#666666"
            }
        });
        text.setOrigin(0.5, 1);
        text.setVisible(false);

        const arrow = this.add.image(x, gameViewHeight - 20, "DownArrow").setDisplaySize(40, 40)
            .setInteractive({ cursor: "pointer" })
            .on("pointerover", () => {
                this.input.setDefaultCursor("pointer");
                if (txt != null)
                {
                    text.setVisible(true);
                }
            })
            .on("pointerout", () => {
                this.input.setDefaultCursor("default");
                if (txt != null)
                {
                    text.setVisible(false);
                }
            })
            .on("pointerup", () => clickFunc());

        return arrow;
    }

    PreloadAllItem ()
    {
        GameScene.GameItems.forEach(item => {
            this.PreloadItem(item.ItemName);
        });
    }

    PreloadItem (itemName)
    {
        let item = GameScene.GetItemInfo(itemName);
        
        if (item !== null)
        {
            if (item.ItemInventoryImgSource != null)
            {
                this.load.image(`${itemName}InventoryImg`, item.ItemInventoryImgSource);
            }

            this.load.image(itemName, item.ItemImgSource);
        }
    }

    CreateInteractableItem (itemName, x, y, width, height, clickFunc=null)
    {
        const item = this.AddItemToScene(itemName, x, y, width, height, true, clickFunc);
        const itemRect = this.CreateInteractableRectArea(x, y, width, height, clickFunc);

        item.setVisible(false);

        itemRect.on("pointerover", () => {
            item.setTint(0xff8800);
            item.setVisible(true);
        })
        .on("pointerout", () => {
            item.setVisible(false);
            item.clearTint();
        });
    }

    CreateInteractableRectArea (x, y, width, height, clickFunc=null, color=0xff00dc, opac=0)
    {
        let rect = this.add.rectangle(x, y, width, height, color, opac);
        rect.setInteractive({ cursor: "pointer" })
            .on("pointerover", () => this.input.setDefaultCursor("pointer"))
            .on("pointerout", () => this.input.setDefaultCursor("default"))
            .on("pointerdown", () => {
                // To set the cursor back to default to prevent bug where the cursor is still pointer if clickFunc is GotoScene(otherScene):
                this.input.setDefaultCursor("default");
                if (clickFunc !== null)
                {
                    clickFunc();
                }
            }, this);

        return rect;
    }

    AddItemToScene (itemName, x, y, width, height, addIfInInventory=false, clickFunc=null)
    {
        // Check if the item is not in inventory or if addIfInInventory is set to true (bypassing inventory check):
        if (GameScene.IsInventoryHasItem(itemName) === false || addIfInInventory === true)
        {
            let itemDisplayImg = this.add.image(x, y, itemName).setDisplaySize(width, height)
                .setInteractive({ useHandCursor: true })
                .on("pointerover", () => {
                    this.input.setDefaultCursor("pointer");
                    itemDisplayImg.setTint(0xff0000);
                })
                .on("pointerout", () => {
                    this.input.setDefaultCursor("default");
                    itemDisplayImg.clearTint();
                })
                .on("pointerdown", () => {
                    if (clickFunc === null)
                    {
                        if (GameScene.GetItemInfo(itemName).Collectable === true)
                        {    
                            if (GameScene.IsInventoryHasItem(itemName) === false)
                            {
                                let res = GameScene.AddItemToInventory(itemName);

                                if (res === true)
                                {
                                    this.PlaySound("Bing");
                                }

                                this.ToggleItemCollectedInterface(itemName);
                            }

                            if (addIfInInventory === false)
                            {
                                itemDisplayImg.setVisible(false);
                            }
                        }
                    }
                    else
                    {
                        clickFunc();

                        if (addIfInInventory === false)
                        {
                            itemDisplayImg.setVisible(false);
                        }
                    }
                });

            return itemDisplayImg;
        }
    }

    CreateIcon (x, y, img, onClick, width=40, height=40)
    {
        const icon = this.add.image(x, y, img).setDisplaySize(width, height);
        icon.setInteractive()
            .on("pointerdown", onClick);
    }

    static GetItemInfo (itemName)
    {
        const itemInfo = GameScene.GameItems.find(item => item.ItemName === itemName);

        // If found, return the item info; otherwise, return null:
        return itemInfo ?? null;
    }

    static AddItemToInventory (itemName, playSound=true)
    {
        const itemInfo = GameScene.GetItemInfo(itemName);

        if (itemInfo !== null)
        {
            if (itemInfo.Collectable === true)
            {
                GameScene.Inventory.push(itemName);
                return true;
            }
        }

        return false;
    }

    static RemoveItemFromInventory (itemName)
    {
        const index = GameScene.Inventory.indexOf(itemName);
        if (index > -1) // If the item is in the inventory:
        {
            GameScene.Inventory.splice(index, 1);
            return true;
        }
        return false;
    }

    static IsInventoryHasItem (itemName)
    {
        if (GameScene.Inventory.indexOf(itemName) > -1)
        {
            return true;
        }

        return false;
    }

    IsSceneRunning (sceneKey)
    {
        return this.scene.isActive(sceneKey);
    }

    IsAnyInterfaceRunning ()
    {
        let interfaceRunning = false;

        // this.game.scene.getScenes(true) return array of scenes that are currently running.
        this.game.scene.getScenes(true).forEach(runningScene => {
            if (runningScene.SceneType === "GameInterface") // Check if the running scene is a game interface.
            {
                interfaceRunning = true;
            }
        });

        return interfaceRunning;
    }

    CloseAllInterface ()
    {
        this.game.scene.getScenes(true).forEach(runningScene => {
            if (runningScene.SceneType === "GameInterface")
            {
                this.ToggleInterface(runningScene.Key, false);
            }
        });
    }

    ExitGame ()
    {
        this.CloseAllInterface();
        GameScene.GameTimer.PauseTimer();
        this.PlaySound("BGM", false);
        GameScene.LastScene = this.Key;
        this.scene.start("Homepage");
    }

    // Placeholders to be overriden:
    Preload ()
    {

    }

    Create ()
    {

    }

    Update ()
    {

    }
}

class GameInterface extends GameScene
{
    constructor (config, enableFullScreenKey=true, enableExitKey=true, enableInventoryKey=true, enableInstructionKey=true, havePanel=false)
    {
        super(config, enableFullScreenKey, enableExitKey, enableInventoryKey, enableInstructionKey);
        
        this.SceneType = "GameInterface";
    }

    Create ()
    {
        const gameViewHeight = this.game.config.height;
        const gameViewWidth = this.game.config.width;

        // Chat box rectangle at the bottom:
        let chatBoxHeight = 300;
        let chatBoxY = gameViewHeight - chatBoxHeight / 2;
        this.ChatBox = this.add.rectangle(400, chatBoxY, 800, chatBoxHeight, 0x000000, 0.8);

        // Text display area in the chat box:
        let chatTextY = chatBoxY - chatBoxHeight / 2 + 10;  // 10 pixels from the top of the chat box.
        this.ChatText = this.add.text(gameViewWidth / 2, chatTextY, "", { font: "16px Roboto", fill: "#ffffff", wordWrap: { width: 780, useAdvancedWrap: true } });
        this.ChatText.setOrigin(0.5, 0.5);

        // Other elements can be added in this area:
        this.DynamicArea = this.add.container(0, 360);
    }

    CreateSelectionList (scene, jsonData, clickFunc)
    {
        const gameViewHeight = this.game.config.height;
        const gameViewWidth = this.game.config.width;

        const title = jsonData.Title;
        const selections = jsonData.Selections;

        if (jsonData.ImgKey !== undefined)
        {
            const imgContainer = this.add.rectangle(100, 75, 150, 150, 0x888888, 1).setOrigin(0.5, 0.5);
            this.AddToDynamicArea(imgContainer);

            const imgElem = this.add.image(100, 100, jsonData.ImgKey);
            imgElem.setDisplaySize(100, 100);
            this.AddToDynamicArea(imgElem);
        }

        // Display the title:
        this.SetChatText(title);

        let startY = 0; // Starting y position for the first option.
        const spacing = 50; // Spacing between selections.

        selections.forEach((selection, index) => {
            // Create a container for each selection:
            let selectionContainer = this.add.container(gameViewWidth / 2, startY + index * spacing);

            // Create an interactable rectangle area:
            let rect = this.add.rectangle(0, 0, 200, 40, 0xffffff, 0.5).setOrigin(0.5);
            rect.setInteractive({ cursor: "pointer" });
            rect.on("pointerdown", () => clickFunc(scene, selection.Option, selection.Value));

            // Create text for the option:
            let optionText = this.add.text(0, 0, selection.Option, { font: "16px Roboto", fill: "#ffffff" }).setOrigin(0.5);

            // Add rectangle and text to the container:
            selectionContainer.add([rect, optionText]);

            // Add the container to the dynamic area:
            this.AddToDynamicArea(selectionContainer);
        });
    }

    AddSideImg (imgKey)
    {
        const imgContainer = this.add.rectangle(100, 75, 150, 150, 0x888888, 1).setOrigin(0.5, 0.5);
        this.AddToDynamicArea(imgContainer);

        const imgElem = this.add.image(100, 100, imgKey);
        imgElem.setDisplaySize(100, 100);
        this.AddToDynamicArea(imgElem);
    }

    Speak (title, message, clickFunc)
    {
        this.SetChatText(title);

        // Create a message text object:
        let messageText = this.add.text(this.game.config.width / 2, 0, message, {
            font: "16px Roboto",
            fill: "#ffffff",
            align: "center",
            wordWrap: { width: 780, useAdvancedWrap: true }
        });

        // Center the message text horizontally:
        messageText.setOrigin(0.5, 0.5);

        // Add the message text objec to the dynamic area:
        this.AddToDynamicArea(messageText);

        return new Promise(resolve => {
            this.ChatBox.setInteractive();
            this.ChatBox.once("pointerdown", () => {
                this.ChatBox.disableInteractive();
                // Optional, if clickFunc is provided:
                if (clickFunc != undefined)
                {
                    clickFunc();
                }
                resolve();
            });
        });

        /*
        // Optional, if clickFunc is provided:
        if (clickFunc !== undefined)
        {
            return new Promise(resolve => {
                this.ChatBox.setInteractive();
                this.ChatBox.once("pointerdown", () => {
                    this.ChatBox.disableInteractive();
                    clickFunc();
                    resolve();
                });
            });
        }
        */
    }

    SetChatText (text)
    {
        this.ChatText.setText(text);
    }

    // Method to add elements to the dynamic area:
    AddToDynamicArea (element)
    {
        this.DynamicArea.add(element);
    }

    ClearDynamicArea ()
    {
        this.DynamicArea.removeAll(true);
    }
}

class Homepage extends GameScene
{
    constructor ()
    {
        super({ key: "Homepage" }, true, false, false, false, false);

        this.SetBackground("HomepageBG", "../../assets/Game/DSC00184.jpg");
    }

    Preload ()
    {
        this.PreloadAllItem();

        this.load.audio("BGM", "../../assets/Game/[no copyright music] Dreamy Mode cute background music.mp3");
    }

    Create ()
    {
        const gameViewHeight = this.game.config.height;
        const gameViewCenterY = gameViewHeight / 2;
        const gameViewWidth = this.game.config.width;
        const gameViewCenterX = gameViewWidth / 2;

        this.add.text(gameViewCenterX, 100, "Foochow Explorers", { fill: "#000000" })
            .setOrigin(0.5)
            .setStyle({ fontSize: "40px", fontFamily: "Roboto" });

        // Start Game Button:
        const startGraphic = this.add.graphics();
        startGraphic.fillStyle(0xffffff, 1);
        startGraphic.fillRoundedRect(gameViewCenterX - 125, gameViewCenterY - 50, 250, 100, 32);

        const startButton = this.add.text(gameViewCenterX, gameViewCenterY, "Start Game", { fill: "#000000" })
            .setOrigin(0.5)
            .setStyle({ fontSize: "24px", fontFamily: "Roboto", backgroundColor: "#ffffff" });

        this.CreateInteractableRectArea(400, 300, 250, 100, () => {
            this.input.setDefaultCursor("default");
            
            // Start game:
            GameScene.InitializeGameStates();
            const bgm = this.sound.add("BGM");
            bgm.loop = true;
            this.PlaySound("BGM", false);
            bgm.play();
            this.ToggleFullScreen(true);
            GameScene.GameTimer.StartTimer();    // Start GameTimer.
            this.GotoScene("GallPos1Dir1", false);
        });

        if (GameScene.LastScene !== null)
        {
            // Continue Game Button:
            const continueGraphic = this.add.graphics();
            continueGraphic.fillStyle(0xffffff, 1);
            continueGraphic.fillRoundedRect(gameViewCenterX - 125, gameViewCenterY - 50 + 150, 250, 100, 32);

            const continueButton = this.add.text(gameViewCenterX, gameViewCenterY + 150, "Continue Game", { fill: "#000000" })
                .setOrigin(0.5)
                .setStyle({ fontSize: "24px", fontFamily: "Roboto", backgroundColor: "#ffffff" });

            this.CreateInteractableRectArea(400, 450, 250, 100, () => {
                GameScene.GameTimer.StartTimer();
                const bgm = this.sound.add("BGM");
                bgm.loop = true;
                this.PlaySound("BGM", false);
                bgm.play();
                this.ToggleFullScreen(true);
                this.GotoScene(GameScene.LastScene, false);
            });
        }
    }
}

class Endpage extends GameScene
{
    constructor ()
    {
        super({ key: "Endpage" }, true, false, false, false, false);

        this.SetBackground("EndpageBG", "../../assets/Game/DSC00184.jpg");
    }

    Create ()
    {
        const gameViewHeight = this.game.config.height;
        const gameViewWidth = this.game.config.width;
        const gameViewCenterX = gameViewWidth / 2;
        const gameViewCenterY = gameViewHeight / 2;

        this.CloseAllGameInterfaces();

        this.PlaySound("BGM", false);

        GameScene.GameTimer.PauseTimer();   // Pause GameTimer.
        let gameTime = GameScene.GameTimer.FormatTime(GameScene.GameTimer.ReadTimer());

        // Create background rectangle for text:
        let bgGraphics = this.add.graphics();
        bgGraphics.fillStyle(0x000000, 0.5);
        bgGraphics.fillRoundedRect(gameViewCenterX - 350, gameViewCenterY - 175, 700, 425, 20);

        // Display the game time:
        this.add.text(gameViewCenterX, gameViewHeight * 0.3, `Your Time: ${gameTime}`, {
            font: "20px Roboto",
            fill: "#ffffff"
        }).setOrigin(0.5);

        // Suggestion to visit the gallery:
        this.add.text(gameViewCenterX, gameViewHeight * 0.4, "Thank you for playing!", {
            font: "24px Roboto",
            fill: "#ffffff"
        }).setOrigin(0.5);

        this.add.text(gameViewCenterX, gameViewHeight * 0.5, "Come visit the Sibu Foochow Heritage Gallery in person to learn more!", {
            font: "18px Roboto",
            fill: "#ffffff",
            align: "center",
            wordWrap: { width: gameViewWidth * 0.8 }
        }).setOrigin(0.5);

        /*
        // Share:
        this.add.text(gameViewCenterX, gameViewHeight * 0.7, "Share your experience on social media!", {
            font: "16px Roboto",
            fill: "#ffffff"
        }).setOrigin(0.5);
        */

        // Restart game button background:
        let restartBtnBG = this.add.graphics();
        restartBtnBG.fillStyle(0xffffff, 1);
        restartBtnBG.fillRoundedRect(gameViewCenterX - 100, gameViewHeight * 0.8 - 20, 200, 40 ,10);

        // Restart game:
        this.add.text(gameViewCenterX, gameViewHeight * 0.8, "Restart Game", {
            font: "18px Roboto",
            fill: "#00ff00"
        }).setOrigin(0.5);

        this.CreateInteractableRectArea(gameViewCenterX, gameViewHeight * 0.8, 200, 40, () => {
            // Restart game:
            GameScene.InitializeGameStates();
            this.ToggleFullScreen(false);
            this.GotoScene("Homepage", false);
        });
    }
}

class GallPos1Dir1 extends GameScene
{
    constructor ()
    {
        super({ key: "GallPos1Dir1" });

        this.SetBackground("GallPos1Dir1BG", "../../assets/Game/LockedGalPos1Dir1.png");
    }

    Preload ()
    {
        this.load.image("OpenedGallDoorBG", "../../assets/Game/OpenedGalPos1Dir1.png");
    }

    Create ()
    {
        // this.AreaGetter();
        this.SetLeftArrow(() => this.GotoScene("GallPos1Dir2"), "Turn Left");
        //this.CreateInteractableRectArea(577, 212, 196, 286, () => this.GotoScene("MainHall"));
        if (GameScene.GalDoorOpened === true)
        {
            this.SetUpArrow(() => this.GotoScene("MainHall"), "Go To Main Hall", 250);
        }

        // this.CreateInteractableRectArea(149, 325, 134, 217, () => this.GotoScene("WongNaiSiongStatue"));
        this.CreateInteractableItem("WNSStatue", 145, 323, 150, 270, () => this.GotoScene("WongNaiSiongStatue"));

        if (GameScene.GalDoorOpened === true)
        {
            this.BG.BGElement.setTexture("OpenedGallDoorBG");
        }

        if (GameScene.InstructionShown === false)
        {
            GameScene.InstructionShown = true;
            this.ToggleInstructionInterface(true);
        }
    }
}

class GallPos1Dir2 extends GameScene
{
    constructor ()
    {
        super({ key: "GallPos1Dir2" });

        this.SetBackground("GallPos1Dir2BG", "../../assets/Game/GalPos1Dir2.jpeg");
    }

    Create ()
    {
        // this.AreaGetter();
        this.SetRightArrow(() => this.GotoScene("GallPos1Dir1"), "Turn Right");
        this.SetUpArrow(() => this.GotoScene("GallPos2Dir1"), "Move Forward");

        this.CreateInteractableItem("PestleAndMortar", 465, 430, 475, 340, () => this.GotoScene("PestleAndMortarScene"));
        this.CreateInteractableItem("RubberMachine", 75, 233, 140, 160, () => this.GotoScene("RubberMakingMachineScene"));
        this.CreateInteractableItem("TV", 340, 245, 245, 180, () => this.GotoScene("TVScene"));
    }
}

class GallPos2Dir1 extends GameScene
{
    constructor ()
    {
        super({ key: "GallPos2Dir1" });

        this.SetBackground("GallPos2Dir1BG", "../../assets/Game/GalPos2Dir1.jpeg");
    }

    Create ()
    {
        // this.AreaGetter();
        this.SetLeftArrow(() => this.GotoScene("GallPos3"), "Move Left");
        this.SetRightArrow(() => this.GotoScene("GallPos2Dir2"), "Turn Right");
        this.SetDownArrow(() => this.GotoScene("GallPos1Dir2"), "Move Backward");

        this.CreateInteractableItem("Piano", 615, 220, 280, 200, () => {
            this.GotoScene("PianoScene");
        });
    }
}

class GallPos2Dir2 extends GameScene
{
    constructor ()
    {
        super({ key: "GallPos2Dir2" });

        this.SetBackground("GallPos2Dir2BG", "../../assets/Game/GalPos2Dir2.jpeg");
    }

    Create ()
    {
        // this.AreaGetter();
        this.SetLeftArrow(() => this.GotoScene("GallPos2Dir1"), "Turn Left");
        
        // this.CreateInteractableRectArea(240, 270, 164, 88, () => this.GotoScene("ChestScene"));
        this.CreateInteractableItem("Chest", 250, 285, 200, 100, () => this.GotoScene("ChestScene"));
    }
}

class GallPos3 extends GameScene
{
    constructor ()
    {
        super({ key: "GallPos3" });

        this.SetBackground("GallPos3BG", "../../assets/Game/GalPos3.png");
    }

    Create ()
    {
        // this.AreaGetter();
        this.SetDownArrow(() => this.GotoScene("GallPos2Dir1"), "Move Backward");
        this.SetUpArrow(() => this.GotoScene("GallPos4"), "Move Forward");

        this.CreateInteractableItem("Pot", 215, 315, 150, 120, () => {
            if (this.IsAnyInterfaceRunning() === false)
            {
                this.ToggleItemCollectedInterface("Pot");

                if (GameScene.PotTaken === false)
                {
                    GameScene.PotTaken = true;
                    let res = GameScene.AddItemToInventory("Pot");
                    
                    if (res === true)
                    {
                        this.PlaySound("Bing");
                    }
                }
            }
        });

        this.CreateInteractableItem("RiceJarWithGrainsAndHusk", 362, 245, 75, 55, () => {
            if (this.IsAnyInterfaceRunning() === false)
            {
                this.ToggleItemCollectedInterface("RiceJarWithGrainsAndHusk");

                if (GameScene.RiceJarTaken === false)
                {
                    GameScene.RiceJarTaken = true;
                    let res = GameScene.AddItemToInventory("RiceJarWithGrainsAndHusk");

                    if (res === true)
                    {
                        this.PlaySound("Bing");
                    }
                }
            }
        });

        this.CreateInteractableItem("Blower", 545, 215, 130, 145, () => this.GotoScene("BlowerScene"));
        this.CreateInteractableItem("ClothShowCases", 700, 135, 195, 140, () => this.GotoScene("ClothScene2"));
    }
}

class GallPos4 extends GameScene
{
    constructor ()
    {
        super({ key: "GallPos4" });

        this.SetBackground("GallPos4BG", "../../assets/Game/GalPos4.png");
    }

    Create ()
    {
        // this.AreaGetter();
        this.SetDownArrow(() => this.GotoScene("GallPos3"), "Move Backward");

        this.CreateInteractableItem("Lamp", 133, 207, 39, 66, () => {
            if (this.IsAnyInterfaceRunning() === false)
            {
                this.ToggleItemCollectedInterface("Lamp");
                
                if (GameScene.LampTaken === false)
                {
                    GameScene.LampTaken = true;
                    let res = GameScene.AddItemToInventory("Lamp");

                    if (res === true)
                    {
                        this.PlaySound("Bing");
                    }
                }
            }
        });

        this.CreateInteractableItem("StrawRiceBasket", 165, 350, 60, 57, () => {
            if (this.IsAnyInterfaceRunning() === false)
            {
                this.ToggleItemCollectedInterface("StrawRiceBasket");

                if (GameScene.StrawRiceBasketTaken === false)
                {
                    GameScene.StrawRiceBasketTaken = true;
                    let res = GameScene.AddItemToInventory("StrawRiceBasket");
                    
                    if (res === true)
                    {
                        this.PlaySound("Bing");
                    }
                }
            }
        });
    }
}

class MainHall extends GameScene
{
    constructor ()
    {
        super({ key: "MainHall" });

        this.SetBackground("MainHallBG", "../../assets/Game/Hall.png");
    }

    Preload ()
    {
        this.load.spritesheet("Dog", "../../assets/Game/Dog2.png", { frameWidth: 400, frameHeight: 370, margin: 0 });
        this.load.image("DogHead", "../../assets/Game/DogHead.png");
        this.load.audio("DogAngry", "../../assets/Game/DogAngry.mp3");
    }

    Create ()
    {
        // this.AreaGetter();
        this.SetDownArrow(() => this.GotoScene("GallPos1Dir1"), "Go To Gallery");
        this.SetUpArrow(() => this.GotoScene("LibraryStair"), "Go To Library Stair");
        this.SetRightArrow(() => this.GotoScene("MainDoor"), "Go To Main Door");

        const dogSprite = this.add.image(34, 404, "Dog", 0);
        dogSprite.setDisplaySize(114, 114)
            .setOrigin(0.5, 0.5)
            .setInteractive({ useHandCursor: true })
            .on("pointerover", () => {
                this.input.setDefaultCursor("pointer");
                dogSprite.setTint(0xff0000);
            })
            .on("pointerout", () => {
                this.input.setDefaultCursor("default");
                dogSprite.clearTint();
            })
            .on("pointerup", async () => {
                if (GameScene.IsInventoryHasItem("Rice") === true)
                {
                    GameScene.DogEaten = true;
                    await this.ToggleTextInterface("", ["Thank you for feeding me. I was hungry. You can pet me.", "You have successfully obtained the key! Now, what should you do?"]);
                    this.ToggleItemCollectedInterface("LibKey");
                    GameScene.RemoveItemFromInventory("Rice");
                    let res = GameScene.AddItemToInventory("LibKey");

                    if (res === true)
                    {
                        this.PlaySound("Bing");
                    }
                }
                
                if (GameScene.DogEaten === false)
                {
                    this.ToggleTextInterface("", [
                        "There is a key on the dog's colar.",
                        "The dog is fierce, but it looks hungry.",
                        "Maybe you can find something to feed it."
                    ]);
                }

                this.PlaySound("DogAngry");
            });
        
        let frame = 0;

        setInterval(() => {
            dogSprite.setFrame(frame);

            frame += 1;

            if (frame >= 8)
            {
                frame = 0;
            }
        }, 1000);

        // this.CreateInteractableRectArea(554, 273, 33, 222, () => this.GotoScene("MainDoor"));
    }
}

class MainDoor extends GameScene
{
    constructor ()
    {
        super({ key: "MainDoor" });

        this.SetBackground("MainDoorBG", "../../assets/Game/LockedMainDoor.png");
    }

    Preload ()
    {
        this.load.image("OpenedMainDoor", "../../assets/Game/OpenedMainDoor.png");
        
        this.load.audio("Unlocked", "../../assets/Game/Unlocked.mp3");
        this.load.audio("Cheer", "../../assets/Game/Cheer.mp3");
    }

    Create ()
    {
        // this.AreaGetter();
        this.SetDownArrow(() => this.GotoScene("MainHall"), "Go To Main Hall");

        if (GameScene.MainDoorOpened === true)
        {
            this.BG.BGElement.setTexture("OpenedMainDoor");
        }
        else
        {
            this.ToggleTextInterface("", ["This is the exit, but the door is locked.", "I need a key to escape."]);
        }

        const mainDoorArea = this.CreateInteractableRectArea(384, 284, 448, 562, () => {
            if (GameScene.MainDoorOpened === true)
            {
                this.GotoScene("Endpage", false);
            }
            else
            {
                if (GameScene.IsInventoryHasItem("MainDoorKey") === true)
                {
                    this.PlaySound("Unlocked");
                    GameScene.MainDoorOpened = true;
                    this.BG.BGElement.setTexture("OpenedMainDoor");
                    this.PlaySound("Cheer");
                    this.ToggleTextInterface("", ["Yeah! I have successfully open the door."]);
                }
            }
        });
    }
}

class LibraryStair extends GameScene
{
    constructor ()
    {
        super({ key: "LibraryStair" });

        this.SetBackground("LibraryStairBG", "../../assets/Game/LockedLibStair.jpg");
    }

    Preload ()
    {
        this.load.image("OpenedLibStairBG", "../../assets/Game/OpenedLibStair.png");
        
        this.load.audio("Unlocked", "../../assets/Game/Unlocked.mp3");
    }

    Create ()
    {
        // this.AreaGetter();
        this.SetDownArrow(() => this.GotoScene("MainHall"), "Go To Main Hall");

        if (GameScene.LibDoorOpened === true)
        {
            this.BG.BGElement.setTexture("OpenedLibStairBG");
        }

        this.SetLeftArrow(() => {
            if (GameScene.LibDoorOpened === true)
            {
                this.GotoScene("Library");
            }
            else
            {
                if (GameScene.IsInventoryHasItem("LibKey") === true)
                {
                    GameScene.LibDoorOpened = true;
                    this.PlaySound("Unlocked");
                    GameScene.RemoveItemFromInventory("LibKey");
                    this.ToggleTextInterface("", ["Congrats! You can enter the library now!"]);
                    this.BG.BGElement.setTexture("OpenedLibStairBG");
                }
                else
                {
                    this.ToggleTextInterface("", ["Oops! You cannot enter library yet!\nExplore every items in the gallery first!"]);
                }
            }
        }, "Enter Library");

        this.CreateInteractableItem("KitchenPic", 410, 165, 280, 200, () => this.GotoScene("Kitchen"));
    }
}

class Library extends GameScene
{
    constructor ()
    {
        super({ key: "Library" });

        this.SetBackground("LibraryBG", "../../assets/Game/Lib.png");
    }

    Create ()
    {
        // this.AreaGetter();
        this.SetRightArrow(() => this.GotoScene("LibraryStair"), "Go To Library Stair");
        
        this.CreateInteractableItem("MarketPic", 317, 202, 140, 103, () => this.GotoScene("MarketPlace"))
    }
}

class ChestScene extends GameScene
{
    constructor ()
    {
        super({ key: "ChestScene" });

        this.SetBackground("ClosedChestBG", "../../assets/Game/LockedChest.png");
    }

    Preload ()
    {
        this.load.image("OpenedChest", "../../assets/Game/OpenedChest.png");
        
        this.load.audio("ChestOpening", "../../assets/Game/ChestOpening.mp3");
    }

    Create ()
    {
        // this.AreaGetter();
        this.SetDownArrow(() => this.GotoScene("GallPos2Dir2"), "Move away from chest");

        if (GameScene.ChestOpened === true)
        {
            this.BG.BGElement.setTexture("OpenedChest");

            if (GameScene.BowlTaken === false)
            {
                this.AddItemToScene("Bowl", 488, 381, 97, 115, false, () => {
                    GameScene.BowlTaken = true;
                    let res = GameScene.AddItemToInventory("Bowl");
                    
                    if (res === true)
                    {
                        this.PlaySound("Bing");
                    }

                    this.ToggleItemCollectedInterface("Bowl");
                });
                this.ToggleTextInterface("", ["You found a bowl!\nThis can be used to collect the latex of rubber tree."]);
            }
        }
        else
        {
            const chestArea = this.CreateInteractableRectArea(386, 309, 574, 352, () => {
                this.sound.play("ChestOpening");
                GameScene.ChestOpened = true;
                this.BG.BGElement.setTexture("OpenedChest");
                chestArea.destroy();

                if (GameScene.BowlTaken === false)
                {
                    this.AddItemToScene("Bowl", 488, 381, 97, 115, false, () => {
                        GameScene.BowlTaken = true;
                        let res = GameScene.AddItemToInventory("Bowl");
                            
                        if (res === true)
                        {
                            this.PlaySound("Bing");
                        }
                        
                        this.ToggleItemCollectedInterface("Bowl");
                    });
                }
            });
        }
    }
}

class Kitchen extends GameScene
{
    constructor ()
    {
        super({ key: "Kitchen" });

        this.SetBackground("KitchenBG", "../../assets/Game/Kitchen.png");
    }

    Create ()
    {
        this.SetDownArrow(() => this.GotoScene("LibraryStair", false), "Go To Library Stair");

        if ((GameScene.IsInventoryHasItem("RiceJarWithRice") === true) && (GameScene.IsInventoryHasItem("Pot") === true) && (GameScene.IsInventoryHasItem("StrawRiceBasket") === true))
        {
            GameScene.RemoveItemFromInventory("RiceJarWithRice");
            GameScene.RemoveItemFromInventory("Pot");
            GameScene.RemoveItemFromInventory("StrawRiceBasket");
            this.ToggleItemCollectedInterface("Rice");
            GameScene.AddItemToInventory("Rice");
            this.PlaySound("Bing");
        }
        else
        {
            this.ToggleTextInterface("", ["Hmmm... How to cook rice here?"]);
        }
    }
}

class MarketPlace extends GameScene
{
    constructor ()
    {
        super({ key: "MarketPlace" });

        this.SetBackground("MarketPlaceBG", "../../assets/Game/MarketPlace.png");
    }

    Preload ()
    {
        this.load.image("Person", "../../assets/Game/Man.png");
    }

    async Create ()
    {
        this.add.image(500, 500, "Person").setDisplaySize(200, 450);

        this.SetDownArrow(() => this.GotoScene("Library", false), "Go To Library");
        this.SetRightArrow(() => this.GotoScene("RubberTreeForest"), "Go To Rubber Tree Forest");

        if (GameScene.IsInventoryHasItem("RubberSheet") === true)
        {
            GameScene.RemoveItemFromInventory("RubberSheet");
            await this.ToggleTextInterface("", ["Great! I don't have money, but here's a key.\nI don't know what is it for. But it might be usefull for you though..."]);
            this.ToggleItemCollectedInterface("MainDoorKey");
            GameScene.AddItemToInventory("MainDoorKey");
            this.PlaySound("Bing");
        }
        else
        {
            this.ToggleTextInterface("Mystery Man", ["Trade some rubber sheet with me and I will help you escape."]);
        }
    }
}

class RubberTreeForest extends GameScene
{
    constructor ()
    {
        super({ key: "RubberTreeForest" });

        this.SetBackground("RubberTreeForestBG", "../../assets/Game/DarkRubberTree.jpg");
    }

    Preload ()
    {
        this.load.image("BrightRubberTreeBG", "../../assets/Game/RubberTree.jpg");
    }

    Create ()
    {
        this.SetLeftArrow(() => this.GotoScene("MarketPlace"), "Go To Market");

        if (GameScene.LatexCollected === true)
        {
            if (GameScene.IsInventoryHasItem("Lamp") === true)
            {
                GameScene.RubberTreeVisible = true;
                GameScene.RemoveItemFromInventory("Lamp");
            }

            if (GameScene.RubberTreeVisible === true)
            {
                this.BG.BGElement.setTexture("BrightRubberTreeBG");
                
                if ((GameScene.IsInventoryHasItem("RubberKnife") === true) && (GameScene.IsInventoryHasItem("Bowl") === true))
                {
                    GameScene.RemoveItemFromInventory("RubberKnife");
                    GameScene.RemoveItemFromInventory("Bowl");

                    GameScene.LatexCollected = true;
                    this.ToggleItemCollectedInterface("BowlOfLatex");
                    GameScene.AddItemToInventory("BowlOfLatex");
                    this.PlaySound("Bing");
                }
                else
                {
                    this.ToggleTextInterface("", ["You need some tools.", "You need rubber knife and rubber latex bowl."]);
                }
            }
            else
            {
                this.ToggleTextInterface("", ["It is too dark to do anything, need a lamp."]);
            }
        }
        else
        {
            this.ToggleTextInterface("", ["Nothing to do here."]);
        }
    }
}

class RubberMakingMachineScene extends GameScene
{
    constructor ()
    {
        super({ key: "RubberMakingMachineScene" });

        this.SetBackground("RubberMakingMachineSceneBG", "../../assets/Game/RubberMachine.jpeg");
    }

    async Create ()
    {
        this.SetDownArrow(() => this.GotoScene("GallPos1Dir2"), "Move away from rubber machine");

        if (GameScene.IsInventoryHasItem("BowlOfLatex") === true)
        {
            GameScene.RemoveItemFromInventory("BowlOfLatex");
            await this.ToggleTextInterface("", ["Congrats! You have successfully processed the rubber! They can be sold at the market place."]);
            this.ToggleItemCollectedInterface("RubberSheet");
            GameScene.AddItemToInventory("RubberSheet");
            this.PlaySound("Bing");
        }
        else
        {
            this.ToggleTextInterface("Rubber Making Machine", ["This machine can be used to process rubber."]);
        }
    }
}

class PestleAndMortarScene extends GameScene
{
    constructor ()
    {
        super({ key: "PestleAndMortarScene" });

        this.SetBackground("PestleAndMortarSceneBG", "../../assets/Game/PNM.jpeg");
    }
    
    async Create ()
    {
        this.SetDownArrow(() => this.GotoScene("GallPos1Dir2"), "Move away from pestle and mortar");

        if (GameScene.IsInventoryHasItem("RiceJarWithGrains") === true)
        {
            GameScene.RemoveItemFromInventory("RiceJarWithGrains");
            await this.ToggleTextInterface("", ["Congrats! You have succesfully turned the grain into rice using pestle and mortar."]);
            this.ToggleItemCollectedInterface("RiceJarWithRice");
            GameScene.AddItemToInventory("RiceJarWithRice");
            this.PlaySound("Bing");
        }
        else
        {
            this.ToggleTextInterface("Pestle and Mortar", ["This can turn grain into rice."]);
        }
    }
}

class BlowerScene extends GameScene
{
    constructor ()
    {
        super({ key: "BlowerScene" });

        this.SetBackground("BlowerSceneBG", "../../assets/Game/Blower.png");
    }

    async Create ()
    {
        if (GameScene.IsInventoryHasItem("RiceJarWithGrainsAndHusk") === true)
        {
            GameScene.RemoveItemFromInventory("RiceJarWithGrainsAndHusk");
            let res = GameScene.AddItemToInventory("RiceJarWithGrains");
            
            if (res === true)
            {
                await this.ToggleTextInterface("", ["Congrats! You have successfully remove the husks!\nHmmm...the husks are removed, but they are still grains. This need to be processed first before it can be cooked."]);
                this.PlaySound("Bing");
            }

            this.ToggleItemCollectedInterface("RiceJarWithGrains");
        }
        else
        {
            this.ToggleTextInterface("Blower", ["This can remove the husk in the grains."]);
        }

        this.SetDownArrow(() => this.GotoScene("GallPos3"), "Move away from blower");
    }
}

class TVScene extends GameScene
{
    constructor ()
    {
        super({ key: "TVScene" });

        this.SetBackground("TVSceneBG", "../../assets/Game/TV.png");
    }

    Preload ()
    {
        this.load.image("Shirt", "../../assets/Game/Shirt.png");
        this.load.image("Gown", "../../assets/Game/Gown.jpeg");
        this.load.image("Hat", "../../assets/Game/ChineseHat.png");
    }

    Create ()
    {
        // this.AreaGetter();
        this.SetDownArrow(() => this.GotoScene("GallPos1Dir2", false), "Move away from TV");

        this.CreateInteractableRectArea(377, 232, 242, 175, () => this.GotoScene("TVScene1"), 0xff8800, 0.5);
    }
}

class TVScene1 extends GameScene
{
    constructor ()
    {
        super({ key: "TVScene1" });

        this.SetBackground("TVScene1", "../../assets/Game/Shirt.png");
    }

    Create ()
    {
        this.ToggleTextInterface("Channel 1", ["Shirt\nThe sequence of the clothes might be important, it seems related to the piano,\nbut this is a black and white TV,\nhow can I know the colour of each clothes?"]);
        this.SetLeftArrow(() => this.GotoScene("TVScene3", false), "Channel 3");
        this.SetRightArrow(() => this.GotoScene("TVScene2", false), "Channel 2");
        this.SetDownArrow(() => this.GotoScene("TVScene", false), "Close the TV");
    }
}

class TVScene2 extends GameScene
{
    constructor ()
    {
        super({ key: "TVScene2" });

        this.SetBackground("TVScene2", "../../assets/Game/Gown.jpeg");
    }

    Create ()
    {
        this.ToggleTextInterface("Channel 2", ["Gown\nThe sequence of the clothes might be important, it seems related to the piano,\nbut this is a black and white TV,\nhow can I know the colour of each clothes?"]);
        this.SetLeftArrow(() => this.GotoScene("TVScene1", false), "Channel 1");
        this.SetRightArrow(() => this.GotoScene("TVScene3", false), "Channel 3");
        this.SetDownArrow(() => this.GotoScene("TVScene", false), "Close the TV");
    }
}

class TVScene3 extends GameScene
{
    constructor ()
    {
        super({ key: "TVScene3" });

        this.SetBackground("TVScene3", "../../assets/Game/ChineseHat.png");
    }

    Create ()
    {
        this.ToggleTextInterface("Channel 3", ["Chinese Hat\nThe sequence of the clothes might be important, it seems related to the piano,\nbut this is a black and white TV,\nhow can I know the colour of each clothes?"]);
        this.SetLeftArrow(() => this.GotoScene("TVScene2", false), "Channel 2");
        this.SetRightArrow(() => this.GotoScene("TVScene1", false), "Channel 1");
        this.SetDownArrow(() => this.GotoScene("TVScene", false), "Close the TV");
    }
}

class ClothScene1 extends GameScene
{
    constructor ()
    {
        super({ key: "ClothScene1" });

        // this.SetBackground("ClothScene1BG", "../../assets/Game/IMG-20240314-WA0190.jpg");
        this.SetBackground("ClothScene1BG", "../../assets/Game/Gown2.png");
    }

    Create ()
    {
        this.SetDownArrow(() => this.GotoScene("GallPos3"), "Move away from show cases");
        this.SetLeftArrow(() => this.GotoScene("ClothScene3", false), "Previous cloth");
        this.SetRightArrow(() => this.GotoScene("ClothScene2", false), "Next cloth");

        this.ToggleTextInterface("Mandarin Gown", ["Dark blue colour mandarin gown."]);
    }
}

class ClothScene2 extends GameScene
{
    constructor ()
    {
        super({ key: "ClothScene2" });

        // this.SetBackground("ClothScene2BG", "../../assets/Game/IMG-20240314-WA0187.jpg");
        this.SetBackground("ClothScene2BG", "../../assets/Game/Shirt2.png");
    }

    Create ()
    {
        this.SetDownArrow(() => this.GotoScene("GallPos3"), "Move away from show cases");
        this.SetLeftArrow(() => this.GotoScene("ClothScene1", false), "Previous cloth");
        this.SetRightArrow(() => this.GotoScene("ClothScene3", false), "Next cloth");

        this.ToggleTextInterface("Shirt", ["Grey colour shirt."]);
    }
}

class ClothScene3 extends GameScene
{
    constructor ()
    {
        super({ key: "ClothScene3" });

        // this.SetBackground("ClothScene3BG", "../../assets/Game/IMG-20240314-WA0192.jpg");
        this.SetBackground("ClothScene3BG", "../../assets/Game/Hat2.png");
    }

    Create ()
    {
        this.SetDownArrow(() => this.GotoScene("GallPos3"), "Move away from show cases");
        this.SetLeftArrow(() => this.GotoScene("ClothScene2", false), "Previous cloth");
        this.SetRightArrow(() => this.GotoScene("ClothScene1", false), "Next cloth");

        this.ToggleTextInterface("Chinese Hat", ["Black colour chinese hat."]);
    }
}

class PianoScene extends GameScene
{
    constructor ()
    {
        super({ key: "PianoScene" });

        this.SetBackground("PianoSceneBG", "../../assets/Game/PianoKeys2.png");
    }

    Preload ()
    {
        this.load.audio("Mi", "../../assets/Game/mi-80239.mp3");
        this.load.audio("Re", "../../assets/Game/re-78500.mp3");
        this.load.audio("Si", "../../assets/Game/si-80238.mp3");
        this.load.audio("Wrong", "../../assets/Game/Wrong.mp3");
        this.load.audio("Unlocked", "../../assets/Game/Unlocked.mp3");
    }

    Create ()
    {
        // this.AreaGetter();

        this.SetDownArrow(() => this.GotoScene("GallPos2Dir1"), "Move away from piano");
        this.ToggleTextInterface("", ["It seems that you need to press the keys with colour labels in a certain order.\nBut hmm... what is the correct colour order?"]);

        this.Arr = [];
        this.CreateInteractableItem("BluePianoKey", 76, 320, 105, 560, () => {
            this.PlaySound("Mi");
            this.Arr.push("BluePianoKey");
            this.CheckGetItem();
        });
        this.CreateInteractableItem("GreyPianoKey", 216, 320, 105, 560, () => {
            this.PlaySound("Re");
            this.Arr.push("GreyPianoKey");
            this.CheckGetItem();
        });
        this.CreateInteractableItem("BlackPianoKey", 700, 320, 105, 560, () => {
            this.PlaySound("Si");
            this.Arr.push("BlackPianoKey");
            this.CheckGetItem();
        });
    }

    CheckGetItem ()
    {
        let res = this.CheckAns();
        
        if (res === true)
        {
            this.Arr = [];
            if (GameScene.GalDoorOpened === false)
            {
                this.PlaySound("Unlocked");
                GameScene.GalDoorOpened = true;
                this.ToggleTextInterface("", ["Congrates! You have successfully unlocked the gallery door! Now to go the main hall."]);
            }
        }
        if (res === false)
        {
            this.Arr = [];
            if (GameScene.GalDoorOpened === false)
            {
                this.PlaySound("Wrong");
            }
        }
    }

    CheckAns ()
    {
        let correct = true;
        const ans = ["GreyPianoKey", "BluePianoKey", "BlackPianoKey"];

        if (this.Arr.length === ans.length)
        {
            for (let i = 0; i < ans.length; i++)
            {
                if (this.Arr[i] !== ans[i])
                {
                    correct = false;
                }
            }

            return correct;
        }
        else
        {
            return null;
        }
    }
}

class WongNaiSiongStatue extends GameScene
{
    constructor ()
    {
        super({ key: "WongNaiSiongStatue" });

        this.SetBackground("WongNaiSiongStatueBG", "../../assets/Game/WNS.jpg");
    }

    Preload ()
    {
        this.load.image("CloseBtn", "../../assets/Game/CloseBtn.png");
    }

    Create ()
    {
        this.SetDownArrow(() => {
            this.ToggleInterface("QuizInterface", false);
            this.GotoScene("GallPos1Dir1");
        }, "Move away from statue");

        this.add.image(780, 280, "CloseBtn").setDisplaySize(40, 40)
            .setInteractive()
            .on("pointerup", () => {
                if (this.IsAnyInterfaceRunning() === false)
                {
                    this.ToggleInterface("QuizInterface", false);
                    this.GotoScene("GallPos1Dir1");
                }
            });

        this.ToggleInterface("QuizInterface", true);
    }
}

class QuizInterface extends GameInterface
{
    constructor ()
    {
        super({ key: "QuizInterface" });
        this.SceneType = "GameScene";
    }

    Create ()
    {
        super.Create();

        this.AddSideImg("WNS");
        this.Speak("Wong Nai Siong:", "Hello, answer all my questions and\nI will give you something that can help you escape.", () => {
            this.ClearDynamicArea();
            this.CreateQsts();
        });
    }

    CreateQsts ()
    {
        // Example:
        const qsts = [
            {
                Title: "What is this item?",
                ImgKey: "LampInventoryImg",
                Selections: [
                    {
                        Option: "Lamp",
                        Value: true
                    },
                    {
                        Option: "Palm",
                        Value: false
                    },
                    {
                        Option: "Malp",
                        Value: false
                    },
                    {
                        Option: "Plam",
                        Value: false
                    }
                ]
            },
            {
                Title: "What is this item use for?",
                ImgKey: "StrawRiceBasketInventoryImg",
                Selections: [
                    {
                        Option: "Use as shoe",
                        Value: false
                    },
                    {
                        Option: "To cook",
                        Value: true
                    },
                    {
                        Option: "Wear",
                        Value: false
                    },
                    {
                        Option: "Catch fish",
                        Value: false
                    }
                ]
            },
            {
                Title: "What is this machine use for?",
                ImgKey: "BlowerInventoryImg",
                Selections: [
                    {
                        Option: "Make balloons",
                        Value: false
                    },
                    {
                        Option: "Video shoting",
                        Value: false
                    },
                    {
                        Option: "To process rice",
                        Value: true
                    },
                    {
                        Option: "Weapon",
                        Value: false
                    }
                ]
            },
            {
                Title: "What is this tool used for?",
                ImgKey: "RubberMachineInventoryImg",
                Selections: [
                    {
                        Option: "Making noodle",
                        Value: false
                    },
                    {
                        Option: "Wash clothes",
                        Value: false
                    },
                    {
                        Option: "Music instrument",
                        Value: false
                    },
                    {
                        Option: "Process rubber",
                        Value: true
                    }
                ]
            }
        ];

        let allCorrect = true;

        const DisplayQuestion = (scene, index=0) => {
            const Clicked = (scene, opt, val) => {
                if (val !== true)
                {
                    allCorrect = false;
                    scene.ClearDynamicArea();
                    scene.AddSideImg("WNS");
                    scene.Speak("Wong Nai Siong:", "Incorrect.", () => {
                        scene.ClearDynamicArea();
                        scene.AddSideImg("WNS");
                        scene.Speak("Wong Nai Siong:", "Explore the gallery first before you come here again.");
                    });
                }
                else
                {
                    DisplayQuestion(scene, index + 1);
                }
            }

            this.ClearDynamicArea();

            if (index < qsts.length)
            {
                if (allCorrect === true)
                {
                    const qst = qsts[index];
                    this.CreateSelectionList(scene, qst, Clicked);
                }
            }
            else
            {
                if (GameScene.RubberKnifeTaken === false)
                {
                    GameScene.RubberKnifeTaken = true;
                    let res = GameScene.AddItemToInventory("RubberKnife");
                    
                    if (res === true)
                    {
                        this.PlaySound("Bing");
                    }
                    this.Speak("Wong Nai Siong", "Congrats! You answered it all correct!\nTake this item, it will help you escape.", () => {
                        this.ClearDynamicArea();
                        this.ToggleItemCollectedInterface("RubberKnife");
                        this.scene.start("GallPos1Dir1");
                        this.ToggleInterface("QuizInterface", false);
                    });
                }
                else
                {
                    this.Speak("Wong Nai Siong:", "Congrats! You answered it all correct");
                }
            }
        }

        DisplayQuestion(this, 0);
    }
}

class InstructionInterface extends GameInterface
{
    constructor ()
    {
        super({ key: "InstructionInterface" });
    }

    Preload ()
    {
        this.load.image("WNS", "../../assets/Game/WNS.png");
    }

    Create ()
    {
        super.Create();

        this.AddSideImg("WNS");
        this.Speak("", "Oh no! You are trapped in the world Fuchou Gallery!\nFind a way to get out of this gallery.", () => {
            this.ClearDynamicArea();
            this.AddSideImg("HomeIcon");
            this.Speak("Hints", "Press this icon or [E] to go back to homepage.", () => {
                this.ClearDynamicArea();
                this.AddSideImg("FullScreenIcon");
                this.Speak("Hints", "Press this icon or [F] to toggle fullscreen.", () => {
                    this.ClearDynamicArea();
                    this.AddSideImg("InventoryIcon");
                    this.Speak("Hints", "Press this icon or [TAB] to open inventory.", () => {
                        this.ClearDynamicArea();
                        this.AddSideImg("InstructionIcon");
                        this.Speak("Hints", "Press this icon or [I] to open this again.", () => {
                            this.ClearDynamicArea();
                            this.AddSideImg("WNS");
                            this.Speak("Hints", "You may want to click on the items in this gallery to interact with them.\nYou may pick them into the inventory by clicking them.", () => {
                                this.ClearDynamicArea();
                                this.ToggleInstructionInterface(false);
                            });
                        });
                    });
                });
            });
            /*
            this.Speak("Hints", "Press [F] to toggle fullscreen\nPress [Tab] to open inventory\nPress [E] to go back to homepage\nPress [I] to open this again", () => {
                this.ClearDynamicArea();
                this.AddSideImg("WNS");
                this.Speak("Hints", "You may want to click on the items to interact with them.\nYou may pick them into the inventory by clicking them.", () => {
                    this.ClearDynamicArea();
                    this.ToggleInstructionInterface(false);
                });
            });
            */
        });
    }
}

class Inventory extends GameScene
{
    constructor ()
    {
        super({ key: "Inventory" });

        this.SceneType = "GameInterface";
    }

    Preload ()
    {
        this.load.image("CloseBtn", "../../assets/Game/CloseBtn.png");
    }

    Create ()
    {
        const gameViewWidth = this.game.config.width;
        const gameViewHeight = this.game.config.height;

        // Slot dimensions and margin:
        const slotSize = 100;   // Size of each slot.
        const slotMargin = 10;  // Margin between slots.

        // Inventory dimensions:
        const inventoryRows = 3;
        const inventoryCols = 4;
        const inventoryWidth = inventoryCols * slotSize + (inventoryCols + 1) * slotMargin;
        const inventoryHeight = inventoryRows * slotSize + (inventoryRows + 1) * slotMargin;
        const inventoryX = (gameViewWidth - inventoryWidth) / 2;    // Center horizontally.
        const inventoryY = (gameViewHeight - inventoryHeight) / 2;  // Center vertically.

        // Creating a semi-transparent background for the inventory:
        const background = this.add.graphics();
        background.fillStyle(0x000000, 0.8);    // Semi-transparent black.
        background.fillRect(inventoryX, inventoryY, inventoryWidth, inventoryHeight);

        // Create grid of slots:
        for (let row = 0; row < inventoryRows; row++)
        {
            for (let col = 0; col < inventoryCols; col++)
            {
                // Calculate position for each slot:
                let x = inventoryX + slotMargin * (col + 1) + (col * slotSize);
                let y = inventoryY + slotMargin * (row + 1) + (row * slotSize);

                // Create a slot:
                const slot = this.add.graphics();
                slot.fillStyle(0xffffff, 0.5);  // Semi-transparent white slot.
                slot.fillRect(x, y, slotSize, slotSize);
            }
        }

        // Display items from the inventory:
        GameScene.Inventory.forEach((itemName, index) => {
            let itemInfo = GameScene.GetItemInfo(itemName);
            if (itemInfo !== null)
            {
                let col = index % inventoryCols;
                let row = Math.floor(index / inventoryCols);

                let x = inventoryX + slotMargin * (col + 1) + col * slotSize;
                let y = inventoryY + slotMargin * (row + 1) + row * slotSize;

                let item = this.add.image(x, y, `${itemName}InventoryImg`)
                    .setDisplaySize(slotSize, slotSize)
                    .setOrigin(0, 0)
                    .setInteractive();

                item.on("pointerdown", (poitner) => {
                    this.ToggleItemDetailInterface(itemName);
                });
            }
        });

        this.add.image(780, 85, "CloseBtn").setDisplaySize(40, 40)
            .setInteractive()
            .on("pointerup", () => {
                this.ToggleItemDetailInterface(null);
                this.ToggleInventoryInterface(false);
            });
    }
}

class ItemDetailInterface extends GameInterface
{
    constructor ()
    {
        super({ key: "ItemDetailInterface" });
    }

    Create ()
    {
        super.Create()

        const gameViewCenterX = this.game.config.width / 2;
        const gameViewCenterY = this.game.config.height / 2;

        const itemName = GameScene.ItemDetailDisplayItemName;
        const itemDisplayName = GameScene.GetItemInfo(GameScene.ItemDetailDisplayItemName).ItemDisplayName;

        const itemBG = this.add.graphics();
        itemBG.fillStyle(0xffffff, 1);
        itemBG.fillRoundedRect(gameViewCenterX - 125, 25, 250, 250, 20);

        this.add.image(gameViewCenterX, 150, `${itemName}InventoryImg`).setDisplaySize(200, 200);
        this.Speak(itemDisplayName, GameScene.GetItemInfo(itemName).ItemDescription);

        this.input.on("pointerdown", () => {
            this.ToggleItemDetailInterface(null);
        });
    }
}

class ItemCollectedInterface extends GameInterface
{
    constructor ()
    {
        super({ key: "ItemCollectedInterface" });
    }

    Create ()
    {
        super.Create()

        const gameViewCenterX = this.game.config.width / 2;
        const gameViewCenterY = this.game.config.height / 2;

        const itemName = GameScene.ItemCollectedItemName;
        const itemDisplayName = GameScene.GetItemInfo(GameScene.ItemCollectedItemName).ItemDisplayName;

        const itemBG = this.add.graphics();
        itemBG.fillStyle(0xffffff, 1);
        itemBG.fillRoundedRect(gameViewCenterX - 125, 25, 250, 250, 20);

        this.add.image(gameViewCenterX, 150, `${itemName}InventoryImg`).setDisplaySize(200, 200);
        this.Speak(itemDisplayName, `You collected ${itemDisplayName}!`);

        this.input.on("pointerdown", () => {
            this.ToggleItemCollectedInterface(null);
        });
    }
}

class TextInterface extends GameInterface
{
    constructor ()
    {
        super({ key: "TextInterface" });
    }

    Create ()
    {
        super.Create();

        if (GameScene.TextInterfaceTexts.length > 0)
        {
            function SpeakNext (clss, index)
            {
                if (index < GameScene.TextInterfaceTexts.length)
                {
                    clss.Speak(GameScene.TextInterfaceTitle, GameScene.TextInterfaceTexts[index], () => {
                        clss.ClearDynamicArea();
                        SpeakNext(clss, index+1);
                    });
                }
                else
                {
                    clss.ToggleTextInterface();
                }
            }

            SpeakNext(this, 0);
        }
        else
        {
            this.ToggleTextInterface();
        }
    }
}

var config = {
    type: Phaser.AUTO,
    scale: {
        mode: Phaser.Scale.FIT,
        parent: "Container",
        autoCenter: Phaser.Scale.CENTER_BOTH,
        width: 800,
        height: 600
    },
    scene: [
        Homepage,
        Endpage,
        GallPos1Dir1,
        GallPos1Dir2,
        GallPos2Dir1,
        GallPos2Dir2,
        GallPos3,
        GallPos4,
        MainHall,
        MainDoor,
        LibraryStair,
        Library,
        ChestScene,
        Kitchen,
        MarketPlace,
        RubberTreeForest,
        RubberMakingMachineScene,
        PestleAndMortarScene,
        BlowerScene,
        TVScene,
        TVScene1,
        TVScene2,
        TVScene3,
        ClothScene1,
        ClothScene2,
        ClothScene3,
        PianoScene,
        WongNaiSiongStatue,
        QuizInterface,
        InstructionInterface,
        Inventory,
        ItemDetailInterface,
        ItemCollectedInterface,
        TextInterface
    ]
}

var game = new Phaser.Game(config);