// Modern Language Bindings (Java & C#) for Apple IIc Ultra Hardware & Standard Libraries

export * from './javaStandardLibrary';
export * from './dotnetCoreLibrary';

export const JAVA_APPLE2_LIB_CODE = `
package apple2;

/**
 * Enhanced Apple IIc Ultra Hardware API for Java
 */
public final class Apple2 {
    // Video Modes
    public static final int MODE_TEXT40 = 0;
    public static final int MODE_TEXT80 = 1;
    public static final int MODE_LORES  = 2;
    public static final int MODE_HIRES  = 3;
    public static final int MODE_DOUBLE_HIRES = 4;

    // 16 Apple II Colors
    public static final int BLACK       = 0;
    public static final int DEEP_RED    = 1;
    public static final int DARK_BLUE   = 2;
    public static final int PURPLE      = 3;
    public static final int DARK_GREEN  = 4;
    public static final int GRAY1       = 5;
    public static final int MEDIUM_BLUE = 6;
    public static final int LIGHT_BLUE  = 7;
    public static final int BROWN       = 8;
    public static final int ORANGE      = 9;
    public static final int GRAY2       = 10;
    public static final int PINK        = 11;
    public static final int LIGHT_GREEN = 12;
    public static final int YELLOW      = 13;
    public static final int AQUAMARINE  = 14;
    public static final int WHITE       = 15;

    public static native void setVideoMode(int mode);
    public static native void clearScreen(int color);
    public static native void drawPixel(int x, int y, int color);
    public static native void drawLine(int x0, int y0, int x1, int y1, int color);
    public static native void drawString(int col, int row, String text);
    
    public static native void beep(int freqHz, int durationMs);
    public static native void playMockingboard(int channel, int freq, int volume);
    
    public static native int  getKey();
    public static native void poke(int address, int value);
    public static native int  peek(int address);
}
`;

export const CSHARP_APPLE2_LIB_CODE = `
namespace Apple2
{
    public static class Graphics
    {
        public const int Black = 0;
        public const int DeepRed = 1;
        public const int DarkBlue = 2;
        public const int Purple = 3;
        public const int DarkGreen = 4;
        public const int Gray1 = 5;
        public const int MediumBlue = 6;
        public const int LightBlue = 7;
        public const int Brown = 8;
        public const int Orange = 9;
        public const int Gray2 = 10;
        public const int Pink = 11;
        public const int LightGreen = 12;
        public const int Yellow = 13;
        public const int Aquamarine = 14;
        public const int White = 15;

        public static void SetDoubleHiRes();
        public static void Clear(int color);
        public static void DrawPixel(int x, int y, int color);
        public static void DrawLine(int x0, int y0, int x1, int y1, int color);
        public static void Print(int col, int row, string message);
    }

    public static class Sound
    {
        public static void Beep(int frequency, int durationMs);
        public static void PlayMockingboard(int voice, int frequency, int volume);
    }

    public static class System
    {
        public static void Poke(int address, byte val);
        public static byte Peek(int address);
        public static char ReadKey();
    }
}
`;
