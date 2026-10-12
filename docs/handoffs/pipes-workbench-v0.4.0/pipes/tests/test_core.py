import os
import tempfile
import unittest
from pathlib import Path
import numpy as np
import soundfile as sf
from pipes_mcp import core

class TestPipes(unittest.TestCase):
    def setUp(self):
        self.tmp=tempfile.TemporaryDirectory()
        self.root=Path(self.tmp.name)
        self._prev=os.environ.get('PIPES_LIBRARY_ROOT')
        os.environ['PIPES_LIBRARY_ROOT']=str(self.root)
        self.path=self.root/'a.wav'
        sr=22050
        y=.1*np.sin(2*np.pi*440*np.arange(sr*3)/sr)
        sf.write(self.path,y,sr)
    def tearDown(self):
        if self._prev is None:os.environ.pop('PIPES_LIBRARY_ROOT',None)
        else:os.environ['PIPES_LIBRARY_ROOT']=self._prev
        self.tmp.cleanup()
    def test_inspection(self):
        m=core.inspect_audio(str(self.path))
        self.assertEqual(m['channels'],1)
        self.assertAlmostEqual(m['duration_seconds'],3,places=2)
        self.assertEqual(len(m['sha256']),64)
    def test_reject_path_escape(self):
        with self.assertRaises(ValueError):core.resolve_audio('/etc/hosts')
    def test_analysis(self):
        a=core.analyze_audio(str(self.path),0,2)
        self.assertGreater(a['mean_spectral_centroid_hz'],100)
        self.assertEqual(len(a['pitch_classes']),12)
    def test_excerpt(self):
        try: e=core.excerpt_audio(str(self.path),.2,1.2)
        except FileNotFoundError:self.skipTest('ffmpeg not installed')
        self.assertTrue(Path(e['output']).exists())
        self.assertAlmostEqual(sf.info(e['output']).duration,1,places=1)
    def test_midi(self):
        n=[{'midi_pitch':62,'start_beat':0,'duration_beats':1,'velocity':80}]
        result=core.create_motif_midi('Rowan_from_prompt_NOT_transcription',n)
        self.assertTrue(Path(result['output']).exists())
        self.assertEqual(result['note_count'],1)

if __name__=='__main__':unittest.main()
