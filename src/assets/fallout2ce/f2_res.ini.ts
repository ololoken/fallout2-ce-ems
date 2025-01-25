export default `
;#########################################################################################################
[MAIN]
; Affects Windows Vista/7/8 and above. Allows hi-res patch settings to be changed without admin privileges 
; if installed in the "Program Files" directory.
; When UAC_AWARE=0 the hi-res patches settings will be stored in the game folder as usual.
; When UAC_AWARE=1 the hi-res patches settings will be stored in the users roaming app data folder.
; For Vista this is usually "C:\\Documents and Settings\\'your user name'\\Application Data\\Fallout2".
; For Windows 7/8 this is usually "C:\\Users\\'your user name'\\AppData\\Roaming\\Fallout2".
UAC_AWARE=0

; Set GRAPHICS_MODE=0 to enable Basic mode which supports resolution change only(required for sfalls Graphic modes). 
; Set GRAPHICS_MODE=1 to enable Direct Draw 7 mode. 
; Set GRAPHICS_MODE=2 to enable DirectX9 mode. 
GRAPHICS_MODE=1

; Set SCALE_2X=1 to scale the game x2.
; Note: This will increase the minimum resolution to from 640x480 to 1280x960.
SCALE_2X=0

; Set the Fullscreen resolution here.
SCR_WIDTH=640
SCR_HEIGHT=480

; Set the Fullscreen colours here.
; 8 for 8bit colour output (original)
; 16 for 16bit colour output (set only if your not using Sfall with graphics modes 4 or 5)
; 32 for 32bit colour output (set only if your not using Sfall with graphics modes 4 or 5)
COLOUR_BITS=32

; Set the Fullscreen refresh rate here. 
; Set REFRESH_RATE=0 for driver default.
REFRESH_RATE=0

; Set WINDOWED=1 to enable windowed mode. 
WINDOWED=1

; Window size and position data, Do not modify.
WIN_DATA=0

; Hi-Res Patch data file and patch folder(Loaded after master.dat)
F2_RES_DAT=f2_res.dat
F2_RES_PATCHES=data

;#########################################################################################################
[INPUT]
; Set ALT_MOUSE_INPUT=0 to allow Sfalls mouse input functions to work.
; Set ALT_MOUSE_INPUT=1 to enable alternate mouse input control built into the hi-res patch.
ALT_MOUSE_INPUT=0

; Set EXTRA_WIN_MSG_CHECKS=1 to prevent the "NOT RESPONDING" error that may occur in windowed mode.
; Adds extra windows message checks to several loops during combat and fade effects.
; This setting is always enabled if ALT_MOUSE_INPUT=1.
EXTRA_WIN_MSG_CHECKS=0

; Set SCROLLWHEEL_FOCUS_PRIMARY_MENU=1 for inventory, barter, loot screens etc. to make mouse wheel control default to the PC's item list unless the cursor is hovering over another list.
SCROLLWHEEL_FOCUS_PRIMARY_MENU=1

;#########################################################################################################
[EFFECTS]
; Play the game in black and white.(Pixote's zany idea)
; Set IS_GRAY_SCALE=1 to enable.
IS_GRAY_SCALE=0

;#########################################################################################################
[HI_RES_PANEL]
; if DISPLAY_LIST_DESCENDING=0 resolutions are listed from lowest to highest.
; if DISPLAY_LIST_DESCENDING=1 resolutions are listed from highest to lowest.
DISPLAY_LIST_DESCENDING=1

;#########################################################################################################
[MOVIES]
; if MOVIE_SIZE=0 - movies remain their original size.
; if MOVIE_SIZE=1 - movies will stretch to fit the screen while maintaining the aspect ratio of the original.
; if MOVIE_SIZE=2 - movies will stretch to fill the screen.
MOVIE_SIZE=1

;#########################################################################################################
[MAPS]
; if EDGE_CLIPPING_ON=0 - area beyond map edges is visible.
; if EDGE_CLIPPING_ON=1 - area beyond map edges is hidden.
EDGE_CLIPPING_ON=1

; if IGNORE_MAP_EDGES=0 - Hi-Res map scroll edges are enabled.
; if IGNORE_MAP_EDGES=1 - Hi-Res map scroll edges are ignored.
IGNORE_MAP_EDGES=0

; if IGNORE_PLAYER_SCROLL_LIMITS=0 - scroll limits from player are controlled by the variables SCROLL_DIST_X and SCROLL_DIST_Y found below.
; if IGNORE_PLAYER_SCROLL_LIMITS=1 - scroll limits from the player are ignored.
IGNORE_PLAYER_SCROLL_LIMITS=0

;SCROLL DISTANCE FROM PLAYER
;HALF_SCRN eqauls half the screen width when used by SCROLL_DIST_X.
;HALF_SCRN eqauls half the screen height width when used by SCROLL_DIST_Y.
; ORIGINAL x:480 y:400
SCROLL_DIST_X=HALF_SCRN
SCROLL_DIST_Y=HALF_SCRN

;Extends the path finding range by increasing the number of path nodes.
;Multiples of 2000 nodes, 1=2000(original), 2=4000, 3=6000, ...etc, 20=40000(max).
NumPathNodes=20

; Set FOG_OF_WAR=1 to enable Fog Of War.
FOG_OF_WAR=0
; Set FOG_LIGHT_LEVEL between 0-10 to change the fog light level
; 0 = Off, 1 = darkest, 10 = brightest. See readme for further details.
FOG_LIGHT_LEVEL=4

;#########################################################################################################
[IFACE]
; if IFACE_BAR_MODE=0 - the bottom of the map view window sits at the top of the IFACE Bar.
; if IFACE_BAR_MODE=1 - the bottom of the map view window extends to the base of the screen and is overlapped by the IFACE Bar.
IFACE_BAR_MODE=0

;if IFACE_BAR_SIDE_ART=0 - Black, No Iface-bar side art used.
;if IFACE_BAR_SIDE_ART=1 - Metal look Iface-bar side art used.
;if IFACE_BAR_SIDE_ART=2 - Leather look Iface-bar side art used.
IFACE_BAR_SIDE_ART=7

;if IFACE_BAR_SIDES_ORI=0 - Iface-bar side graphics extend from the Iface-Bar to the Screen edges.
;if IFACE_BAR_SIDES_ORI=1 - Iface-bar side graphics extend from the Screen edges to the Iface-Bar.
IFACE_BAR_SIDES_ORI=0

;This will increase the width of the interface bar expanding the area used to display text.
;if IFACE_BAR_WIDTH=640 - Interface bar will remain at it's original width.
IFACE_BAR_WIDTH=800

;W.I.P. - A small mod that replaces the Ammo Metre.
;if ALTERNATE_AMMO_METRE=0 - Disabled.
;if ALTERNATE_AMMO_METRE=1 - Single colour, the colours used can be set below with the ALTERNATE_AMMO_LIGHT and ALTERNATE_AMMO_DARK options.
;if ALTERNATE_AMMO_METRE=2 - Changes colour depending how much ammo remains in your current weapon.
;if ALTERNATE_AMMO_METRE=3 - Divides the metre into several differently coloured sections.
ALTERNATE_AMMO_METRE=1

;ALTERNATE_AMMO_LIGHT and ALTERNATE_AMMO_DARK set the palette offsets of particular colours used when ALTERNATE_AMMO_METRE is set to 1.
;ALTERNATE_AMMO_LIGHT is the main colour, ALTERNATE_AMMO_DARK is the darker glow colour.
;Some posible combinations to try are:
;    green  - light 0xC4, dark 0x4B
;    yellow - light 0x3A, dark 0x42
;    orange - light 0x91, dark 0x9A
;    red    - light 0x84, dark 0x8C
ALTERNATE_AMMO_LIGHT=0xC4
ALTERNATE_AMMO_DARK=0x4B

;#########################################################################################################
[MAINMENU]
; if set to 0 - main-menu image will display at its original size.
; if set to 1 - main-menu image will stretch to fit the screen while maintaining its aspect ratio.
; if set to 2 - main-menu image will stretch to fill the screen.
MAIN_MENU_SIZE=2

; if set to 1 - hi-res main-menu graphics are used instead of original 'mainmenu.frm'.
USE_HIRES_IMAGES=1

; if set to 1 - menu-buttons, text & text-background are scaled up for better visibility when using hi-res graphics.
SCALE_BUTTONS_AND_TEXT_MENU=0

; When using a hi-res background, MENU_BG_OFFSET_X & MENU_BG_OFFSET_Y equal the
; distances in pixels from the top button to Menu Background Graphic edges.
; For Fallout1 in Fallout2 engine mod, when using graphics from the Fallout1 Hi-Res patch.
;MENU_BG_OFFSET_X=-24
;MENU_BG_OFFSET_Y=-24
; For Fallout 2
MENU_BG_OFFSET_X=-24
MENU_BG_OFFSET_Y=-20

;#########################################################################################################
[STATIC_SCREENS]
; if set to 0 - background image will display at its original size.
; if set to 1 - background image will stretch to fit the screen while maintaining its aspect ratio.
; if set to 2 - background image will stretch to fill the screen.
DEATH_SCRN_SIZE=2
END_SLIDE_SIZE=2
HELP_SCRN_SIZE=2
SPLASH_SCRN_SIZE=2

;#########################################################################################################
[OTHER_SETTINGS]
; if DIALOG_SCRN_BACKGROUND=0 - Map and Iface-bar are VISIBLE while viewing the Dialog Screen.
; if DIALOG_SCRN_BACKGROUND=1 - Map and Iface-bar are HIDDEN while viewing the Dialog Screen.
DIALOG_SCRN_BACKGROUND=0

; Set DIALOG_SCRN_ART_FIX=1 to enable Continuum's new dialog screen graphic.
DIALOG_SCRN_ART_FIX=1

; Increases the length of time the Splash screen is displayed in seconds
SPLASH_SCRN_TIME=1

; Set to 1 to reduce CPU usage and heat generation by allowing the system to go idle. 
; This setting should not be enabled if Sfalls "ProcessorIdle" setting is also enabled as this will likly cause slowdowns.
CPU_USAGE_FIX=1

; Set to 1 to enable a small adjustment to the mouse selection rect for the PC's inventory on the barter window.
BARTER_PC_INV_DROP_FIX=1

; Original value = 60, decrease/increase this value to quicken/slowdown fade effects.
FADE_TIME_MODIFIER=30

; Set to 1 to enable, recalculates fade time length each time a transitional fade occurs.
; May be useful if the length of transitional fade effects seems to randomly change between game restarts.  
FADE_TIME_RECALCULATE_ON_FADE=0

`
