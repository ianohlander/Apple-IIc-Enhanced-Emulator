// Java Standard Library Implementations on 65C02 Silicon
// Provides core java.lang, java.util, java.io, and apple2.hardware APIs

export const JAVA_LANG_SOURCE = `
package java.lang;

public class Object {
    public boolean equals(Object obj) {
        return this == obj;
    }
    public int hashCode() {
        return System.identityHashCode(this);
    }
    public String toString() {
        return getClass().getName() + "@" + Integer.toHexString(hashCode());
    }
    public final native Class<?> getClass();
}

public final class String implements CharSequence {
    private final char[] value;
    private final int count;

    public String(char[] val) {
        this.count = val.length;
        this.value = new char[this.count];
        for (int i = 0; i < this.count; i++) this.value[i] = val[i];
    }

    public int length() { return count; }
    public char charAt(int index) { return value[index]; }

    public boolean equals(Object anObject) {
        if (this == anObject) return true;
        if (anObject instanceof String) {
            String anotherString = (String)anObject;
            if (count == anotherString.count) {
                for (int i = 0; i < count; i++) {
                    if (value[i] != anotherString.value[i]) return false;
                }
                return true;
            }
        }
        return false;
    }

    public String substring(int beginIndex, int endIndex) {
        int subLen = endIndex - beginIndex;
        char[] sub = new char[subLen];
        for (int i = 0; i < subLen; i++) sub[i] = value[beginIndex + i];
        return new String(sub);
    }
}

public final class StringBuilder {
    private char[] buffer;
    private int length;

    public StringBuilder() {
        this.buffer = new char[32];
        this.length = 0;
    }

    public StringBuilder append(String str) {
        if (str == null) return this;
        for (int i = 0; i < str.length(); i++) {
            append(str.charAt(i));
        }
        return this;
    }

    public StringBuilder append(char c) {
        ensureCapacity(length + 1);
        buffer[length++] = c;
        return this;
    }

    public StringBuilder append(int i) {
        return append(Integer.toString(i));
    }

    private void ensureCapacity(int minCapacity) {
        if (minCapacity > buffer.length) {
            char[] newBuf = new char[buffer.length * 2];
            for (int i = 0; i < length; i++) newBuf[i] = buffer[i];
            buffer = newBuf;
        }
    }

    public String toString() {
        char[] result = new char[length];
        for (int i = 0; i < length; i++) result[i] = buffer[i];
        return new String(result);
    }
}

public final class Math {
    public static final double PI = 3.141592653589793;
    public static final double E  = 2.718281828459045;

    public static int abs(int a) { return (a < 0) ? -a : a; }
    public static int min(int a, int b) { return (a <= b) ? a : b; }
    public static int max(int a, int b) { return (a >= b) ? a : b; }

    public static native double sin(double a);
    public static native double cos(double a);
    public static native double sqrt(double a);
    public static native double floor(double a);
}

public final class Integer {
    public static final int MIN_VALUE = 0x80000000;
    public static final int MAX_VALUE = 0x7fffffff;

    public static String toString(int i) {
        if (i == 0) return "0";
        boolean neg = i < 0;
        char[] buf = new char[12];
        int ptr = 11;
        int v = neg ? -i : i;
        while (v > 0) {
            buf[ptr--] = (char)('0' + (v % 10));
            v /= 10;
        }
        if (neg) buf[ptr--] = '-';
        int len = 11 - ptr;
        char[] res = new char[len];
        for (int j = 0; j < len; j++) res[j] = buf[ptr + 1 + j];
        return new String(res);
    }

    public static String toHexString(int i) {
        char[] hexDigits = {'0','1','2','3','4','5','6','7','8','9','A','B','C','D','E','F'};
        char[] buf = new char[8];
        for (int j = 7; j >= 0; j--) {
            buf[j] = hexDigits[i & 0x0f];
            i >>>= 4;
        }
        return new String(buf);
    }
}

public final class System {
    public static final java.io.PrintStream out = new java.io.PrintStream();
    
    public static native long currentTimeMillis();
    public static native void arraycopy(Object src, int srcPos, Object dest, int destPos, int length);
    public static native void gc();
    public static native int identityHashCode(Object x);
}
`;

export const JAVA_UTIL_SOURCE = `
package java.util;

public class ArrayList<E> {
    private Object[] elementData;
    private int size;

    public ArrayList() {
        this.elementData = new Object[16];
        this.size = 0;
    }

    public int size() { return size; }
    public boolean isEmpty() { return size == 0; }

    public boolean add(E e) {
        if (size >= elementData.length) {
            Object[] newArr = new Object[elementData.length * 2];
            for (int i = 0; i < size; i++) newArr[i] = elementData[i];
            elementData = newArr;
        }
        elementData[size++] = e;
        return true;
    }

    @SuppressWarnings("unchecked")
    public E get(int index) {
        return (E) elementData[index];
    }

    public void clear() {
        for (int i = 0; i < size; i++) elementData[i] = null;
        size = 0;
    }
}

public class Random {
    private long seed;

    public Random() { this.seed = System.currentTimeMillis(); }
    public Random(long seed) { this.seed = seed; }

    public int nextInt(int bound) {
        seed = (seed * 0x5DEECE66DL + 0xBL) & ((1L << 48) - 1);
        int bits = (int)(seed >>> 17);
        return (int)((bound * (long)bits) >> 31);
    }
}
`;

export const JAVA_IO_SOURCE = `
package java.io;

public class PrintStream {
    public void print(String s) {
        if (s == null) s = "null";
        for (int i = 0; i < s.length(); i++) {
            apple2.hardware.AppleSystem.cout(s.charAt(i));
        }
    }

    public void println(String s) {
        print(s);
        apple2.hardware.AppleSystem.cout('\\r');
    }

    public void println(int i) {
        println(Integer.toString(i));
    }
}

public class File {
    private final String path;
    public File(String pathname) { this.path = pathname; }
    public String getPath() { return path; }
    public String getName() { return path; }
    public boolean exists() { return true; }
    public long length() { return 512L; }
    public String[] list() { return apple2.hardware.AppleStorage.getCatalog(0x70); }
    public boolean delete() { return true; }
}

public class FileInputStream {
    private final String path;
    private int blockIndex = 2;
    public FileInputStream(String pathname) { this.path = pathname; }
    public FileInputStream(File file) { this.path = file.getPath(); }
    public int read(byte[] b) {
        apple2.hardware.AppleStorage.readBlock(0x70, blockIndex, b);
        return b.length;
    }
    public void close() {}
}

public class FileOutputStream {
    private final String path;
    private int blockIndex = 2;
    public FileOutputStream(String pathname) { this.path = pathname; }
    public FileOutputStream(File file) { this.path = file.getPath(); }
    public void write(byte[] b) {
        apple2.hardware.AppleStorage.writeBlock(0x70, blockIndex, b);
    }
    public void close() {}
}
`;

export const JAVA_APPLE2_HARDWARE_SOURCE = `
package apple2.hardware;

public final class AppleGraphics {
    public static final int MODE_TEXT40 = 0;
    public static final int MODE_TEXT80 = 1;
    public static final int MODE_LORES  = 2;
    public static final int MODE_HIRES  = 3;
    public static final int MODE_DOUBLE_HIRES = 4;

    public static native void setVideoMode(int mode);
    public static native void clearScreen(int color);
    public static native void drawPixel(int x, int y, int color);
    public static native void drawLine(int x0, int y0, int x1, int y1, int color);
    public static native void drawString(int col, int row, String text);
}

public final class AppleAudio {
    public static native void beep(int freqHz, int durationMs);
    public static native void playMockingboard(int channel, int freq, int volume);
}

public final class AppleSystem {
    public static native void poke(int address, int value);
    public static native int  peek(int address);
    public static native int  getKey();
    public static native void cout(char ch);
    public static native int  getMouseX();
    public static native int  getMouseY();
    public static native boolean isMouseButtonDown(int button);
}

public final class AppleSlinky {
    public static native void setAddress(int address24Bit);
    public static native void writeByte(int b);
    public static native int  readByte();
}

public final class AppleStorage {
    public static final int UNIT_SLOT6_DRIVE1 = 0x60;
    public static final int UNIT_SLOT6_DRIVE2 = 0xE0;
    public static final int UNIT_SLOT7_DRIVE1 = 0x70; // 32MB SmartPort HD (/HD)
    public static final int UNIT_SLOT7_DRIVE2 = 0xF0;

    public static native byte[] readBlock(int unit, int blockNum);
    public static native void readBlock(int unit, int blockNum, byte[] buffer);
    public static native void writeBlock(int unit, int blockNum, byte[] buffer);
    public static native String[] getCatalog(int unit);
    public static native void format(int unit, String volumeName);
}
`;
