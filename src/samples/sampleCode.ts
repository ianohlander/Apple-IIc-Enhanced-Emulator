export const SAMPLE_JAVA_CODE = `// Java for Apple IIc Ultra — Double Hi-Res & Sound Demo
import apple2.Apple2;

public class UltraDemo {
    public static void main(String[] args) {
        // Activate 140x192 16-Color Double Hi-Res Mode
        Apple2.setVideoMode(Apple2.MODE_DOUBLE_HIRES);
        Apple2.clearScreen(Apple2.BLACK);

        // Print vintage welcome text
        Apple2.drawString(0, 0, "JAVA VM RUNNING ON APPLE IIC ULTRA");
        
        // Play 1-Bit Speaker tone
        Apple2.beep(440, 200);
    }
}
`;

export const SAMPLE_CSHARP_CODE = `// C# .NET for Apple IIc Ultra — Graphics & Hardware Control
using Apple2;

namespace RetroApp
{
    public class Program
    {
        public static void Main()
        {
            // Switch to Double Hi-Res Graphics Mode
            Graphics.SetDoubleHiRes();
            Graphics.Clear(Graphics.Black);

            // Display title
            Graphics.Print(0, 0, "C# .NET CLR ON APPLE IIC 65C02");

            // Play startup beep
            Sound.Beep(520, 150);
        }
    }
}
`;
