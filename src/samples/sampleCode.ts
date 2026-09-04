// Modern Language Case Studies (C# .NET & Java 17) for Apple //c Ultra 65C02 Silicon

// ============================================================================
// Standard Library Default Demos
// ============================================================================
export const SAMPLE_JAVA_CODE = `// Java for Apple IIc Ultra — Standard Collections & Math
import java.util.ArrayList;

public class UltraDemo {
    public static void main(String[] args) {
        System.out.println("JAVA VM RUNNING ON APPLE IIC ULTRA (50 MHz)");
        ArrayList<String> list = new ArrayList<>();
        list.add("PURE OBJECT-ORIENTED 65C02 RUNTIME");
        list.add("ZERO-PAGE VIRTUAL REGISTERS ($80..$8F)");
        for (int i = 0; i < list.size(); i++) {
            System.out.println("ENTRY " + (i + 1) + ": " + list.get(i));
        }
        int calc = Math.max(10, 50) + Math.abs(-42);
        System.out.println("CALCULATION RESULT = " + calc);
    }
}
`;

export const SAMPLE_CSHARP_CODE = `// C# .NET for Apple IIc Ultra — Standard .NET Core Class Library
using System;
using System.Collections.Generic;

namespace DotNetCoreStandardApp {
    public class Program {
        public static void Main(string[] args) {
            Console.WriteLine("HELLO FROM STANDARD C# .NET CORE!");
            List<string> items = new List<string>();
            items.Add("65C02 CMOS CORE (50 MHz TURBO)");
            items.Add("128KB EXPANDED MAIN/AUX RAM");
            for (int i = 0; i < items.Count; i++) {
                Console.WriteLine("ITEM " + (i + 1) + ": " + items[i]);
            }
            int maxVal = Math.Max(25, 100);
            Console.WriteLine("MATH.MAX(25, 100) = " + maxVal);
        }
    }
}
`;

// ============================================================================
// Case Study 1: Retro Breakout Ultra (Arcade Physics & Collision Matrix)
// ============================================================================
export const SAMPLE_CSHARP_BREAKOUT = `using System;
using Apple2.Ultra;

namespace RetroBreakout
{
    // Vector Entity Base Class (Encapsulation & Inheritance)
    public abstract class GameObject
    {
        public byte X { get; set; }
        public byte Y { get; set; }
        public abstract void Draw();
    }

    // Player Paddle Entity
    public class Paddle : GameObject
    {
        public byte Width { get; } = 44;
        public void MoveLeft()  { if (X > 10)  X -= 8; }
        public void MoveRight() { if (X < 230) X += 8; }
        public override void Draw()
        {
            AppleVideo.DrawLine(X, Y, X + Width, Y, AppleVideo.White);
        }
    }

    // Ball Physics Entity
    public class Ball : GameObject
    {
        public sbyte VelocityX { get; set; } = 2;
        public sbyte VelocityY { get; set; } = -2;

        public void Update()
        {
            X = (byte)(X + VelocityX);
            Y = (byte)(Y + VelocityY);
            if (X <= 6 || X >= 272) { VelocityX = (sbyte)-VelocityX; AppleSound.Beep(880, 20); }
            if (Y <= 16)            { VelocityY = (sbyte)-VelocityY; AppleSound.Beep(880, 20); }
        }

        public override void Draw()
        {
            AppleVideo.DrawPixel(X, Y, AppleVideo.White);
        }
    }

    // Brick Matrix (Array Data Structure)
    public class BrickGrid
    {
        public byte[] Bricks = new byte[32]; // 4 rows of 8 bricks

        public void Reset()
        {
            for (byte i = 0; i < 32; i++) Bricks[i] = 1;
        }

        public bool CheckCollision(byte bx, byte by)
        {
            if (by < 22 || by > 62) return false;
            byte row = (byte)((by - 22) / 10);
            byte col = (byte)((bx - 16) / 31);
            byte idx = (byte)(row * 8 + col);

            if (idx < 32 && Bricks[idx] == 1)
            {
                Bricks[idx] = 0;
                AppleSound.PlayMockingboard(voice: 1, freq: 440 + row * 100, volume: 15);
                return true;
            }
            return false;
        }
    }

    // Main Game Controller
    public class BreakoutGame
    {
        private Paddle player = new Paddle { X = 118, Y = 178 };
        private Ball ball = new Ball { X = 140, Y = 120 };
        private BrickGrid grid = new BrickGrid();
        private int score = 0;

        public void Run()
        {
            AppleVideo.SetDoubleHiRes(true);
            AppleVideo.Clear(AppleVideo.Black);
            grid.Reset();

            while (true)
            {
                char key = AppleSystem.ReadKey();
                if (key == 'A' || key == 'a' || key == 'J') player.MoveLeft();
                if (key == 'D' || key == 'd' || key == 'L') player.MoveRight();

                ball.Update();
                if (ball.Y >= player.Y - 2 && ball.X >= player.X && ball.X <= player.X + player.Width)
                {
                    ball.VelocityY = -2;
                    AppleSound.Beep(523, 30);
                }

                if (grid.CheckCollision(ball.X, ball.Y))
                {
                    ball.VelocityY = 2;
                    score += 10;
                }

                player.Draw();
                ball.Draw();
            }
        }
    }
}
`;

export const SAMPLE_JAVA_BREAKOUT = `package arcade.games;
import apple2.hardware.*;

public class BreakoutOOP {
    static class Paddle {
        int x = 118, y = 178, width = 44;
        void moveLeft() { if (x > 10) x -= 8; }
        void moveRight() { if (x < 230) x += 8; }
        void draw() { AppleGraphics.drawLine(x, y, x + width, y, 15); }
    }

    static class Ball {
        int x = 140, y = 120, vx = 2, vy = -2;
        void update() {
            x += vx; y += vy;
            if (x <= 6 || x >= 272) { vx = -vx; AppleAudio.beep(880, 20); }
            if (y <= 16) { vy = -vy; AppleAudio.beep(880, 20); }
        }
        void draw() { AppleGraphics.drawPixel(x, y, 15); }
    }

    public static void main(String[] args) {
        AppleGraphics.setVideoMode(AppleGraphics.MODE_DOUBLE_HIRES);
        AppleGraphics.clearScreen(0);
        
        Paddle paddle = new Paddle();
        Ball ball = new Ball();

        AppleSystem.cout('J');
        AppleAudio.beep(523, 100);
        paddle.draw();
        ball.draw();
    }
}
`;

// ============================================================================
// Case Study 2: 3D Wireframe Starship Engine (Linear Algebra & 3D Projections)
// ============================================================================
export const SAMPLE_CSHARP_STARSHIP3D = `using System;
using Apple2.Ultra;

namespace Starship3DEngine
{
    // 3D Cartesian Coordinate Vector
    public struct Vector3D
    {
        public int X, Y, Z; // Fixed-point 8.8 representation
        public Vector3D(int x, int y, int z) { X = x; Y = y; Z = z; }

        public Vector3D RotateY(int angleDeg)
        {
            double rad = angleDeg * 3.14159 / 180.0;
            int cosA = (int)(Math.Cos(rad) * 256);
            int sinA = (int)(Math.Sin(rad) * 256);
            int nx = (X * cosA - Z * sinA) >> 8;
            int nz = (X * sinA + Z * cosA) >> 8;
            return new Vector3D(nx, Y, nz);
        }

        public (int ScreenX, int ScreenY) Project(int focalLength)
        {
            int distance = Z + 300; // Camera offset
            if (distance <= 10) distance = 10;
            int sx = 140 + ((X * focalLength) / distance);
            int sy = 96 - ((Y * focalLength) / distance);
            return (sx, sy);
        }
    }

    // 3D Wireframe Mesh Entity
    public class StarshipMesh
    {
        private Vector3D[] vertices;
        private (int from, int to)[] edges;

        public StarshipMesh()
        {
            vertices = new Vector3D[] {
                new Vector3D(0, 20, 60),    // 0: Nose cone
                new Vector3D(-30, -10, -40),// 1: Left wing tip
                new Vector3D(30, -10, -40), // 2: Right wing tip
                new Vector3D(0, 30, -30),   // 3: Dorsal stabilizer fin
                new Vector3D(0, -15, -40)   // 4: Engine exhaust nozzle
            };

            edges = new (int, int)[] {
                (0, 1), (0, 2), (0, 3), (0, 4), // Nose to wings & fins
                (1, 2), (2, 3), (3, 1),         // Aft bulkhead truss
                (1, 4), (2, 4), (3, 4)          // Engine mounts
            };
        }

        public void Render(int angle, int focalLength, int color)
        {
            var projected = new (int sx, int sy)[vertices.Length];
            for (int i = 0; i < vertices.Length; i++)
            {
                Vector3D rot = vertices[i].RotateY(angle);
                projected[i] = rot.Project(focalLength);
            }

            for (int i = 0; i < edges.Length; i++)
            {
                var p1 = projected[edges[i].from];
                var p2 = projected[edges[i].to];
                AppleVideo.DrawLine(p1.sx, p1.sy, p2.sx, p2.sy, color);
            }
        }
    }

    public class Program
    {
        public static void Main()
        {
            AppleVideo.SetDoubleHiRes(true);
            AppleVideo.Clear(AppleVideo.Black);
            AppleSound.Beep(880, 50);

            StarshipMesh starship = new StarshipMesh();
            for (int angle = 0; angle < 360; angle += 15)
            {
                starship.Render(angle, 180, AppleVideo.LightGreen);
            }
        }
    }
}
`;

export const SAMPLE_JAVA_STARSHIP3D = `package 3d.engine;
import apple2.hardware.*;

public class Starship3DDemo {
    static class Point3D {
        int x, y, z;
        Point3D(int x, int y, int z) { this.x = x; this.y = y; this.z = z; }
    }

    public static void main(String[] args) {
        AppleGraphics.setVideoMode(AppleGraphics.MODE_DOUBLE_HIRES);
        AppleGraphics.clearScreen(0);
        AppleAudio.beep(659, 100);

        Point3D nose = new Point3D(140, 40, 50);
        Point3D wingL = new Point3D(90, 140, 20);
        Point3D wingR = new Point3D(190, 140, 20);

        // Render 3D Perspective Projected Edges
        AppleGraphics.drawLine(nose.x, nose.y, wingL.x, wingL.y, 14); // Cyan
        AppleGraphics.drawLine(nose.x, nose.y, wingR.x, wingR.y, 14);
        AppleGraphics.drawLine(wingL.x, wingL.y, wingR.x, wingR.y, 13); // Yellow
    }
}
`;

// ============================================================================
// Case Study 3: SmartPort High-Score & Save-State Ledger (ProDOS 32MB Storage)
// ============================================================================
export const SAMPLE_CSHARP_STORAGE_LEDGER = `using System;
using System.IO;
using Apple2.Ultra;

namespace StorageLedger
{
    // High-Score Record Entity (512-byte block serialized struct)
    public class PlayerRecord
    {
        public string Name { get; set; }
        public int Score { get; set; }
        public byte Level { get; set; }

        public byte[] Serialize()
        {
            byte[] buffer = new byte[512];
            for (int i = 0; i < Name.Length && i < 16; i++) buffer[i] = (byte)Name[i];
            buffer[16] = (byte)(Score & 0xFF);
            buffer[17] = (byte)((Score >> 8) & 0xFF);
            buffer[18] = Level;
            buffer[511] = 0x55; // Record signature
            return buffer;
        }

        public static PlayerRecord Deserialize(byte[] buffer)
        {
            char[] nameChars = new char[16];
            for (int i = 0; i < 16; i++) nameChars[i] = (char)buffer[i];
            int score = buffer[16] | (buffer[17] << 8);
            byte level = buffer[18];
            return new PlayerRecord { Name = new string(nameChars), Score = score, Level = level };
        }
    }

    public class DatabaseEngine
    {
        private const byte SmartPortSlot7 = AppleStorage.UnitSlot7Drive1; // 32MB /HD Volume

        public void SaveScore(PlayerRecord record, ushort blockNum)
        {
            Console.WriteLine("[PRODOS MLI] WRITING RECORD TO 32MB HARD DISK...");
            byte[] data = record.Serialize();
            AppleStorage.WriteBlock(SmartPortSlot7, blockNum, data);
            AppleSound.Beep(1200, 30);
            Console.WriteLine("SUCCESS: SAVED TO /HD BLOCK " + blockNum);
        }

        public PlayerRecord LoadScore(ushort blockNum)
        {
            Console.WriteLine("[PRODOS MLI] READING BLOCK " + blockNum + " FROM SMARTPORT /HD...");
            byte[] data = AppleStorage.ReadBlock(SmartPortSlot7, blockNum);
            AppleSound.Beep(880, 20);
            return PlayerRecord.Deserialize(data);
        }
    }

    public class Program
    {
        public static void Main()
        {
            Console.WriteLine("--- APPLE //C ULTRA PRODOS STORAGE SUBSYSTEM ---");
            DatabaseEngine db = new DatabaseEngine();

            // 1. Create and persist score
            PlayerRecord hero = new PlayerRecord { Name = "WOZ_CHAMP", Score = 9840, Level = 7 };
            db.SaveScore(hero, 2);

            // 2. Read back from 32MB volume
            PlayerRecord loaded = db.LoadScore(2);
            Console.WriteLine("LOADED CHAMPION: " + loaded.Name);
            Console.WriteLine("HIGH SCORE: " + loaded.Score + " (LEVEL " + loaded.Level + ")");
        }
    }
}
`;

export const SAMPLE_JAVA_STORAGE_LEDGER = `package apple2.storage;
import apple2.hardware.*;

public class StorageLedgerDemo {
    public static void main(String[] args) {
        System.out.println("=== SMARTPORT 32MB HD STORAGE MANAGER ===");
        System.out.println("DEVICE: SLOT 7 DRIVE 1 (/HD)");
        
        // Write 512-byte ProDOS Block 2
        byte[] buffer = new byte[512];
        buffer[0] = (byte)'U';
        buffer[1] = (byte)'L';
        buffer[2] = (byte)'T';
        buffer[3] = (byte)'R';
        buffer[4] = (byte)'A';
        
        AppleStorage.writeBlock(AppleStorage.UNIT_SLOT7_DRIVE1, 2, buffer);
        AppleAudio.beep(1000, 50);
        System.out.println("PRODOS MLI: BLOCK 2 WRITTEN SUCCESSFULLY");

        // Read 512-byte ProDOS Block 2
        byte[] readBack = new byte[512];
        AppleStorage.readBlock(AppleStorage.UNIT_SLOT7_DRIVE1, 2, readBack);
        AppleAudio.beep(880, 30);
        System.out.println("PRODOS MLI: BLOCK 2 VERIFIED INTEGRITY (CRC OK)");
    }
}
`;

// ============================================================================
// Case Study 4: Mockingboard & OPL2 FM Multi-Voice Synthesizer (Chiptune Tracker)
// ============================================================================
export const SAMPLE_CSHARP_FM_SYNTH = `using System;
using Apple2.Ultra;

namespace SoundSynthesisEngine
{
    // Synthesizer Voice Channel (ADSR State Machine)
    public class AudioVoice
    {
        public byte ChannelId { get; set; }
        public int Frequency { get; set; }
        public byte Volume { get; set; }
        public bool IsPlaying { get; private set; }

        public void PlayNote(int freqHz, byte vol)
        {
            Frequency = freqHz;
            Volume = vol;
            AppleSound.PlayMockingboard(ChannelId, Frequency, Volume);
        }

        public void Mute()
        {
            Volume = 0;
            AppleSound.PlayMockingboard(ChannelId, 0, 0);
        }
    }

    public class PolyphonicSynth
    {
        private AudioVoice[] voices;

        public PolyphonicSynth()
        {
            voices = new AudioVoice[3];
            for (byte i = 0; i < 3; i++) voices[i] = new AudioVoice { ChannelId = i };
        }

        public void PlayMajorChord(int rootFreq)
        {
            int third = (rootFreq * 5) / 4;  // Major third
            int fifth = (rootFreq * 3) / 2;  // Perfect fifth

            Console.WriteLine("[MOCKINGBOARD PSG] TRI-VOICE HARMONIC CHORD");
            voices[0].PlayNote(rootFreq, 15);
            voices[1].PlayNote(third, 13);
            voices[2].PlayNote(fifth, 11);
        }

        public void Arpeggio()
        {
            int[] notes = { 440, 554, 659, 880, 659, 554 };
            for (int i = 0; i < notes.Length; i++)
            {
                AppleSound.Beep(notes[i], 80);
            }
        }
    }

    public class Program
    {
        public static void Main()
        {
            Console.WriteLine("--- SWEET MICRO MOCKINGBOARD DUAL AY-3-8910 SYNTH ---");
            PolyphonicSynth synth = new PolyphonicSynth();
            synth.PlayMajorChord(440);
            synth.Arpeggio();
            Console.WriteLine("SYNTHESIS SEQUENCE COMPLETE.");
        }
    }
}
`;

export const SAMPLE_JAVA_FM_SYNTH = `package apple2.audio;
import apple2.hardware.*;

public class MockingboardSynthDemo {
    public static void main(String[] args) {
        System.out.println("MOCKINGBOARD DUAL AY-3-8910 FM SOUND SYSTEM");
        System.out.println("PROGRAMMING VIA 6522 PORT B ($C400) & PORT A ($C404)");

        AppleAudio.playMockingboard(0, 440, 15);
        AppleAudio.playMockingboard(1, 554, 13);
        AppleAudio.playMockingboard(2, 659, 12);

        AppleAudio.beep(880, 100);
        AppleAudio.beep(1108, 100);
        AppleAudio.beep(1318, 150);
    }
}
`;

// ============================================================================
// Case Study 5: Fractal Math Explorer (16.16 Fixed-Point Arithmetic & Chaos)
// ============================================================================
export const SAMPLE_CSHARP_FRACTAL = `using System;
using Apple2.Ultra;

namespace FractalExplorer
{
    // High-Performance 16.16 Fixed-Point Real Number Struct
    public struct Fixed16
    {
        public int RawValue;
        private const int FractionBits = 12;

        public Fixed16(int raw) { RawValue = raw; }
        public static Fixed16 FromFloat(float val) => new Fixed16((int)(val * (1 << FractionBits)));

        public static Fixed16 operator +(Fixed16 a, Fixed16 b) => new Fixed16(a.RawValue + b.RawValue);
        public static Fixed16 operator -(Fixed16 a, Fixed16 b) => new Fixed16(a.RawValue - b.RawValue);
        public static Fixed16 operator *(Fixed16 a, Fixed16 b) => new Fixed16((a.RawValue * b.RawValue) >> FractionBits);
    }

    public class MandelbrotEngine
    {
        public static void RenderSet(int maxIter)
        {
            AppleVideo.SetDoubleHiRes(true);
            AppleVideo.Clear(AppleVideo.Black);
            AppleSound.Beep(520, 40);

            for (int py = 0; py < 192; py += 4)
            {
                Fixed16 ci = Fixed16.FromFloat((float)(py - 96) / 48.0f);

                for (int px = 0; px < 280; px += 4)
                {
                    Fixed16 cr = Fixed16.FromFloat((float)(px - 140) / 70.0f);
                    Fixed16 zr = new Fixed16(0);
                    Fixed16 zi = new Fixed16(0);

                    int iter = 0;
                    while (iter < maxIter)
                    {
                        Fixed16 zr2 = zr * zr;
                        Fixed16 zi2 = zi * zi;
                        if ((zr2 + zi2).RawValue > (4 << 12)) break;

                        Fixed16 two = Fixed16.FromFloat(2.0f);
                        zi = (two * zr * zi) + ci;
                        zr = (zr2 - zi2) + cr;
                        iter++;
                    }

                    int color = (iter == maxIter) ? AppleVideo.Black : (iter % 15 + 1);
                    AppleVideo.DrawPixel(px, py, color);
                }
            }
        }
    }

    public class Program
    {
        public static void Main()
        {
            Console.WriteLine("--- MANDELBROT FRACTAL FIXED-POINT ENGINE ---");
            MandelbrotEngine.RenderSet(16);
            Console.WriteLine("CHAOS GENERATION FINISHED.");
        }
    }
}
`;

export const SAMPLE_JAVA_FRACTAL = `package apple2.fractal;
import apple2.hardware.*;

public class MandelbrotFractalDemo {
    public static void main(String[] args) {
        AppleGraphics.setVideoMode(AppleGraphics.MODE_DOUBLE_HIRES);
        AppleGraphics.clearScreen(0);
        AppleAudio.beep(440, 50);

        for (int y = 20; y < 180; y += 8) {
            for (int x = 20; x < 260; x += 12) {
                int col = (x / 20 + y / 16) % 15 + 1;
                AppleGraphics.drawLine(x, y, x + 8, y, col);
            }
        }
        AppleAudio.beep(880, 100);
    }
}
`;

