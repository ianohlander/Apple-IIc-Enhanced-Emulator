import React, { useState } from 'react';
import { Apple2cUltra } from '../../emulator/apple2c';
import { JavaApple2Compiler } from '../../emulator/runtimes/javaVm';
import { CSharpApple2Compiler } from '../../emulator/runtimes/clrRunner';
import { SAMPLE_JAVA_CODE, SAMPLE_CSHARP_CODE } from '../../samples/sampleCode';
import { JAVA_APPLE2_LIB_CODE, CSHARP_APPLE2_LIB_CODE } from '../../emulator/runtimes/apple2Api';
import { ModernCodeCompilationResult } from '../../types/emulator';
import { Code, Play, Terminal, BookOpen, CheckCircle2, FileCode } from 'lucide-react';

interface ModernCodeStudioProps {
  emulator: Apple2cUltra;
}

export const ModernCodeStudio: React.FC<ModernCodeStudioProps> = ({ emulator }) => {
  const [activeLang, setActiveLang] = useState<'java' | 'csharp'>('java');
  const [code, setCode] = useState<string>(SAMPLE_JAVA_CODE);
  const [activeTab, setActiveTab] = useState<'editor' | 'asm' | 'api'>('editor');
  const [compilationResult, setCompilationResult] = useState<ModernCodeCompilationResult | null>(null);

  const handleLangChange = (lang: 'java' | 'csharp') => {
    setActiveLang(lang);
    setCode(lang === 'java' ? SAMPLE_JAVA_CODE : SAMPLE_CSHARP_CODE);
    setCompilationResult(null);
  };

  const handleCompile = () => {
    const res = activeLang === 'java'
      ? JavaApple2Compiler.compile(code)
      : CSharpApple2Compiler.compile(code);
    setCompilationResult(res);
    setActiveTab('asm');
  };

  const handleExecute = () => {
    let res = compilationResult;
    if (!res) {
      res = activeLang === 'java'
        ? JavaApple2Compiler.compile(code)
        : CSharpApple2Compiler.compile(code);
      setCompilationResult(res);
    }
    // Inject generated 65C02 binary at $2000 and execute!
    emulator.injectBinary(res.entryAddress, res.binary, true);
  };

  return (
    <div className="bg-stone-900 border border-stone-800 rounded-xl p-4 font-mono text-stone-200 text-xs shadow-xl flex flex-col space-y-4">
      {/* Studio Header */}
      <div className="flex flex-wrap items-center justify-between border-b border-stone-800 pb-3 gap-2">
        <div className="flex items-center space-x-2">
          <Code className="w-4 h-4 text-amber-500" />
          <span className="text-amber-500 font-bold text-sm">MODERN RUNTIME STUDIO (Java & .NET CLR)</span>
        </div>

        <div className="flex items-center space-x-2">
          <div className="flex bg-stone-950 p-0.5 rounded-lg border border-stone-800">
            <button
              onClick={() => handleLangChange('java')}
              className={`px-2.5 py-1 rounded text-xs font-bold transition ${
                activeLang === 'java' ? 'bg-amber-600 text-white shadow-sm' : 'text-stone-400 hover:text-stone-200'
              }`}
            >
              ☕ Java JVM
            </button>
            <button
              onClick={() => handleLangChange('csharp')}
              className={`px-2.5 py-1 rounded text-xs font-bold transition ${
                activeLang === 'csharp' ? 'bg-purple-600 text-white shadow-sm' : 'text-stone-400 hover:text-stone-200'
              }`}
            >
              🟣 C# .NET CLR
            </button>
          </div>

          <button
            onClick={handleCompile}
            className="px-3 py-1.5 rounded bg-stone-800 hover:bg-stone-700 text-stone-200 font-bold border border-stone-700 flex items-center gap-1"
          >
            <FileCode className="w-3.5 h-3.5 text-amber-400" /> Compile to 65C02
          </button>

          <button
            onClick={handleExecute}
            className="px-3 py-1.5 rounded bg-green-600 hover:bg-green-700 text-white font-bold flex items-center gap-1.5 shadow transition"
          >
            <Play className="w-3.5 h-3.5" /> Run on Apple IIc
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center space-x-2 border-b border-stone-800 pb-2 text-xs">
        <button
          onClick={() => setActiveTab('editor')}
          className={`px-3 py-1 rounded font-bold transition ${
            activeTab === 'editor' ? 'bg-stone-800 text-amber-400 border border-stone-700' : 'text-stone-400 hover:text-stone-200'
          }`}
        >
          Source Code ({activeLang.toUpperCase()})
        </button>

        <button
          onClick={() => setActiveTab('asm')}
          className={`px-3 py-1 rounded font-bold transition ${
            activeTab === 'asm' ? 'bg-stone-800 text-amber-400 border border-stone-700' : 'text-stone-400 hover:text-stone-200'
          }`}
        >
          Generated 65C02 Assembly {compilationResult ? `(${compilationResult.byteCodeSize} bytes)` : ''}
        </button>

        <button
          onClick={() => setActiveTab('api')}
          className={`px-3 py-1 rounded font-bold transition ${
            activeTab === 'api' ? 'bg-stone-800 text-amber-400 border border-stone-700' : 'text-stone-400 hover:text-stone-200'
          }`}
        >
          <BookOpen className="w-3.5 h-3.5 inline mr-1" /> Apple II Hardware API
        </button>
      </div>

      {/* Tab Content */}
      {activeTab === 'editor' && (
        <div className="flex flex-col space-y-2">
          <textarea
            value={code}
            onChange={(e) => setCode(e.target.value)}
            rows={14}
            className="w-full bg-stone-950 border border-stone-800 rounded-lg p-3 font-mono text-xs text-amber-200 leading-relaxed focus:outline-none focus:border-amber-600 resize-y"
            placeholder="Write your Java or C# code here..."
            spellCheck={false}
          />
        </div>
      )}

      {activeTab === 'asm' && (
        <div className="bg-stone-950 border border-stone-800 rounded-lg p-3 max-h-72 overflow-y-auto font-mono text-xs text-stone-300">
          {compilationResult ? (
            <div className="flex flex-col space-y-3">
              <div className="flex items-center space-x-2 text-green-400 font-bold">
                <CheckCircle2 className="w-4 h-4" />
                <span>Compilation Successful: Entry Vector $2000 | Output: {compilationResult.byteCodeSize} bytes binary</span>
              </div>
              <pre className="text-amber-300 text-[11px] leading-relaxed whitespace-pre-wrap">
                {compilationResult.generated6502Asm}
              </pre>
            </div>
          ) : (
            <div className="text-stone-500 py-8 text-center">
              Click "Compile to 65C02" to view the generated cycle-accurate machine code.
            </div>
          )}
        </div>
      )}

      {activeTab === 'api' && (
        <div className="bg-stone-950 border border-stone-800 rounded-lg p-3 max-h-72 overflow-y-auto font-mono text-xs text-stone-300">
          <pre className="text-cyan-300 text-[11px] leading-relaxed whitespace-pre-wrap">
            {activeLang === 'java' ? JAVA_APPLE2_LIB_CODE : CSHARP_APPLE2_LIB_CODE}
          </pre>
        </div>
      )}
    </div>
  );
};
