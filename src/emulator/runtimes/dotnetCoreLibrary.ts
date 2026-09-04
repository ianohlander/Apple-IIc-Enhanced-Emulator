// .NET Core Standard Class Library Implementations for 65C02 Silicon
// Provides core System, Collections.Generic, System.IO, and Apple2.Ultra APIs

export const CSHARP_SYSTEM_SOURCE = `
namespace System
{
    public class Object
    {
        public virtual bool Equals(object obj) => this == obj;
        public virtual int GetHashCode() => 0;
        public virtual string ToString() => GetType().FullName;
        public Type GetType() => new Type();
    }

    public class String
    {
        private readonly char[] _chars;
        public int Length => _chars.Length;

        public String(char[] chars)
        {
            _chars = new char[chars.Length];
            for (int i = 0; i < chars.Length; i++) _chars[i] = chars[i];
        }

        public char this[int index] => _chars[index];

        public static bool IsNullOrEmpty(string value) => value == null || value.Length == 0;

        public string Substring(int startIndex, int length)
        {
            char[] sub = new char[length];
            for (int i = 0; i < length; i++) sub[i] = _chars[startIndex + i];
            return new string(sub);
        }
    }

    public static class Math
    {
        public const double PI = 3.141592653589793;
        public const double E = 2.718281828459045;

        public static int Abs(int value) => value < 0 ? -value : value;
        public static int Min(int val1, int val2) => val1 <= val2 ? val1 : val2;
        public static int Max(int val1, int val2) => val1 >= val2 ? val1 : val2;

        public static double Sin(double a);
        public static double Cos(double a);
        public static double Sqrt(double d);
    }

    public static class Console
    {
        public static void Write(string value)
        {
            if (value == null) return;
            for (int i = 0; i < value.Length; i++)
            {
                Apple2.Ultra.AppleSystem.Cout(value[i]);
            }
        }

        public static void WriteLine(string value)
        {
            Write(value);
            Apple2.Ultra.AppleSystem.Cout('\\r');
        }

        public static void WriteLine(int value) => WriteLine(value.ToString());
        public static void Clear() => Apple2.Ultra.AppleVideo.Clear(0);
    }

    public class Random
    {
        private int _seed;
        public Random() { _seed = 12345; }
        public Random(int seed) { _seed = seed; }

        public int Next(int maxValue)
        {
            _seed = (_seed * 214013 + 2531011) & 0x7fffffff;
            return (_seed >> 16) % maxValue;
        }
    }
}
`;

export const CSHARP_COLLECTIONS_SOURCE = `
namespace System.Collections.Generic
{
    public class List<T>
    {
        private T[] _items;
        private int _size;

        public int Count => _size;

        public List()
        {
            _items = new T[8];
            _size = 0;
        }

        public void Add(T item)
        {
            if (_size == _items.Length)
            {
                T[] newArr = new T[_items.Length * 2];
                for (int i = 0; i < _size; i++) newArr[i] = _items[i];
                _items = newArr;
            }
            _items[_size++] = item;
        }

        public T this[int index]
        {
            get => _items[index];
            set => _items[index] = value;
        }

        public void Clear()
        {
            _size = 0;
        }
    }
}
`;

export const CSHARP_SYSTEM_IO_SOURCE = `
namespace System.IO
{
    public static class File
    {
        public static string ReadAllText(string path)
        {
            byte[] block = Apple2.Ultra.AppleStorage.ReadBlock(0x70, 2);
            char[] chars = new char[block.Length];
            for (int i = 0; i < block.Length; i++) chars[i] = (char)block[i];
            return new string(chars);
        }

        public static void WriteAllText(string path, string contents)
        {
            byte[] block = new byte[512];
            for (int i = 0; i < contents.Length && i < 512; i++) block[i] = (byte)contents[i];
            Apple2.Ultra.AppleStorage.WriteBlock(0x70, 2, block);
        }

        public static byte[] ReadAllBytes(string path)
        {
            return Apple2.Ultra.AppleStorage.ReadBlock(0x70, 2);
        }

        public static void WriteAllBytes(string path, byte[] bytes)
        {
            Apple2.Ultra.AppleStorage.WriteBlock(0x70, 2, bytes);
        }

        public static bool Exists(string path) => true;
        public static void Delete(string path) { }
    }

    public static class Directory
    {
        public static bool Exists(string path) => true;
        public static string[] GetFiles(string path)
        {
            return Apple2.Ultra.AppleStorage.GetCatalog(0x70);
        }
    }
}
`;

export const CSHARP_APPLE2_ULTRA_SOURCE = `
namespace Apple2.Ultra
{
    public static class AppleVideo
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

        public static void SetDoubleHiRes(bool enable);
        public static void Clear(int color);
        public static void DrawPixel(int x, int y, int color);
        public static void DrawLine(int x0, int y0, int x1, int y1, int color);
        public static void DrawString(int col, int row, string text);
    }

    public static class AppleSound
    {
        public static void Beep(int frequency, int durationMs);
        public static void PlayMockingboard(int voice, int frequency, int volume);
    }

    public static class AppleSystem
    {
        public static void Poke(int address, byte val);
        public static byte Peek(int address);
        public static char ReadKey();
        public static void Cout(char ch);
        public static int GetMouseX();
        public static int GetMouseY();
        public static bool IsMouseButtonDown(int button);
    }

    public static class AppleMemory
    {
        public static void SetSlinkyAddress(int address24Bit);
        public static void WriteSlinkyByte(byte val);
        public static byte ReadSlinkyByte();
    }

    public static class AppleStorage
    {
        public const byte UnitSlot6Drive1 = 0x60;
        public const byte UnitSlot6Drive2 = 0xE0;
        public const byte UnitSlot7Drive1 = 0x70; // 32MB SmartPort HD (/HD)
        public const byte UnitSlot7Drive2 = 0xF0;

        public static byte[] ReadBlock(byte unit, ushort blockNum);
        public static void ReadBlock(byte unit, ushort blockNum, byte[] buffer);
        public static void WriteBlock(byte unit, ushort blockNum, byte[] buffer);
        public static string[] GetCatalog(byte unit);
        public static void Format(byte unit, string volumeName);
    }
}
`;
