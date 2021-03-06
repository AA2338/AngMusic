import { Component, OnInit } from '@angular/core';
import { Dataservice } from '../dataservice.service';
import { SongService } from '../song-service.service';
import { Playlist } from '../playlistType';

@Component({
  selector: 'app-player',
  templateUrl: './player.component.html',
  styleUrls: ['./player.component.css'],
})
export class PlayerComponent implements OnInit {
  dataUrl: string =
    'https://music-database-d7799-default-rtdb.europe-west1.firebasedatabase.app/.json';
  audio: any;
  time: number = 0;
  currentSong: any = { title: '' };
  currentSongDuration: number = 0;
  songPlaying: boolean = false;
  songdata: any = {};
  volume: number = 1;
  volumeStored: number = 1;
  hasSound: boolean = true;
  timer!: any;
  timerRunning: boolean = false;
  currentPlaylist!: Playlist;
  playlistEnded: boolean = false;
  currentSongImg: string = '../../assets/images/placeholder.png';
  isSingleClick: boolean = true;

  constructor(
    private dataService: Dataservice,
    private songService: SongService
  ) {
    this.songService.getEventSubject().subscribe((playlistObject: Playlist) => {
      if (playlistObject !== undefined) {
        this.changeSong(playlistObject);
      }
    });
  }

  ngOnInit(): void {
    this.dataService
      .getAllData()
      .subscribe((loadedData) => (this.songdata = loadedData));
  }

  startTimer() {
    if (!this.timerRunning) {
      this.timer = setInterval(() => {
        if (this.songPlaying) {
          this.time = this.audio.currentTime;
          this.audio.volume = this.volume;
        }
      }, 100);
      this.timerRunning = true;
    }
  }

  stopClock() {
    clearInterval(this.timer);
    this.timerRunning = false;
  }

  playPause() {
    if (!this.audio) return;
    if (this.playlistEnded) {
      this.currentPlaylist.index = 0;
      this.changeSong(this.currentPlaylist);
      return;
    }
    if (this.songPlaying) {
      this.time = this.audio.currentTime;
      this.audio.pause();
      this.songPlaying = false;
      this.stopClock();
    } else {
      if (this.currentSong !== undefined) {
        this.audio.currentTime = this.time;

        this.currentSongDuration = this.audio.duration;

        this.songPlaying = true;
        this.startTimer();

        this.audio.play();
      }
    }
  }

  changeSong(playlistObject: Playlist) {
    this.currentPlaylist = playlistObject;

    this.playlistEnded = false;
    this.songPlaying = true;
    this.currentSong = this.currentPlaylist.playlist[
      this.currentPlaylist.index
    ];

    this.currentSongImg = this.currentPlaylist.img;
    this.time = 0;

    // Jos jokin biisi on jo soimassa, se pys??ytet????n
    if (this.audio) this.audio.pause();

    this.audio = new Audio(
      'https://firebasestorage.googleapis.com/v0/b/music-database-d7799.appspot.com/o/' +
        this.currentSong.song_id
    );

    if (this.audio) {
      // Laitetaan kappaleen voluumi halutuksi
      this.audio.volume = this.volume;

      // Ladataan kappaleen metadata, josta saadaan sen pituus.
      this.audio.addEventListener('loadedmetadata', (_event: any) => {
        if (this.audio.duration) this.currentSongDuration = this.audio.duration;

        // K??ynnistet????n ajastin, joka p??ivitt???? progress baria ja ????nenvoimakkuutta.
        this.startTimer();
        this.audio.play();

        // Odotetaan, ett?? kappale p????ttyy.
        this.audio.addEventListener('ended', () => {
          this.audio.ended === true;

          // Jos kappale ei ole soittolistansa viimeinen, laitetaan seuraava kappale soimaan.
          if (
            this.currentPlaylist.playlist.length - 1 >
            this.currentPlaylist.index
          ) {
            this.currentPlaylist.index++;
            this.changeSong(this.currentPlaylist);
          } else {
            // Muuten pys??ytet????n kaikki musiikki.
            this.stopClock();
            this.playlistEnded = true;
            this.songPlaying = false;
          }
        });
      });
    } else {
      console.error('Virhe kappaletta ladattaessa');
    }
  }

  back() {
    if (this.audio) {
      this.isSingleClick = true;
      setTimeout(() => {
        if (this.isSingleClick) {
          this.time = 0;
          this.audio.currentTime = 0;
          this.changeSong(this.currentPlaylist);
        }
      }, 250);
    }
  }

  doubleClickBack() {
    this.isSingleClick = false;
    if (this.audio && this.currentSong) {
      // Jos parhaillaan soiva biisi ei ole soittolistan ensimm??inen...
      if (
        this.currentSong.title !== this.currentPlaylist.playlist[0].title &&
        this.currentPlaylist.index !== 0
      ) {
        // Laitetaan edelt??v?? biisi soimaan v??hent??m??ll?? indeksi??
        this.currentPlaylist.index--;
        this.playlistEnded = false;
        this.changeSong(this.currentPlaylist);
      }
    }
  }

  forward() {
    // Vied????n nykyinen kappale loppuun, jos sit?? on viel?? j??ljell??.
    if (this.audio && this.songPlaying) {
      this.time = this.audio.duration;
      this.audio.currentTime = this.audio.duration;
      return;
    }

    // Jos soittolista on jo p????ttynyt, aloitetaan se alusta.
    if (this.playlistEnded) {
      this.currentPlaylist.index = 0;
      this.changeSong(this.currentPlaylist);
    }
  }

  toggleMute() {
    if (this.volume !== 0) {
      this.volumeStored = this.volume;
      this.hasSound = false;
      this.volume = 0;
    } else {
      this.hasSound = true;
      this.volume = this.volumeStored;
    }
  }
}
