<a name="readme-top"></a>
<!-- PROJECT SHIELDS -->
<!--
*** I'm using markdown "reference style" links for readability.
*** Reference links are enclosed in brackets [ ] instead of parentheses ( ).
*** See the bottom of this document for the declaration of the reference variables
*** for contributors-url, forks-url, etc. This is an optional, concise syntax you may use.
*** https://www.markdownguide.org/basic-syntax/#reference-style-links
-->
<!--[![Contributors][contributors-shield]][contributors-url]
[![Forks][forks-shield]][forks-url]
[![Stargazers][stars-shield]][stars-url]-->
[![Issues][issues-shield]][issues-url]
[![MIT License][license-shield]][license-url]
<!--[![LinkedIn][linkedin-shield]][linkedin-url]-->

<!-- PROJECT LOGO -->
<br />
<div align="center">
  <a href="https://github.com/raddad772/jsmoo">
    <!--<img src="images/logo.png" alt="Logo" width="80" height="80">-->Logo here in future
  </a>

<h3 align="center">JSMoo</h3>

  <p align="center">
    JSMoo JavaScript-based quality emulators
    <br />
    <!--<a href="https://github.com/raddad772/jsmoo"><strong>Explore the docs »</strong></a>
    <br />
    <br />
    <a href="https://github.com/raddad772/jsmoo">View Demo</a>-->
    ·
    <a href="https://github.com/raddad772/jsmoo/issues">Report Bug</a>
    ·
    <a href="https://github.com/raddad772/jsmoo/issues">Request Feature</a>
  </p>
</div>



<!-- TABLE OF CONTENTS -->
<details>
  <summary>Table of Contents</summary>
  <ol>
    <li>
      <a href="#about-the-project">About The Project</a>
<!--      <ul>
        <li><a href="#built-with">Built With</a></li>
      </ul>-->
    </li>
    <li>
      <a href="#getting-started">Getting Started</a>
      <ul>
        <li><a href="#prerequisites">Prerequisites</a></li>
        <li><a href="#installation">Installation</a></li>
      </ul>
    </li>
    <li><a href="#roadmap">Roadmap</a></li>
    <li><a href="#contributing">Contributing</a></li>
    <li><a href="#license">License</a></li>
    <li><a href="#contact">Contact</a></li>
    <li><a href="#acknowledgments">Acknowledgments</a></li>
  </ol>
</details>



<!-- ABOUT THE PROJECT -->
## About The Project

<!--[![Product Name Screen Shot][product-screenshot]](https://example.com)-->

JSMoo is an attempt at making great emulators, in pure JavaScript. Currently that includes NES, SNES, ZX Spectrum, and (soon) SMS, with many more planned.

I also hope to make retro systems more accessible in every possible way, as I get into more detail below. But first...

JSMoo was born out of reading the source to Higan and various articles on the difficulty of emulating the SNES accurately. I thought that a lot of structural and organizational mistakes were made that slowed the codebase down a lot. Full 100%-accurate SNES emulation took very powerful hardware, but - or so I reasoned - I could do it on mid-range hardware, in JavaScript, as a challenge for myself.

I was right. I got the proof-of-concept working. Fully cycle-accurate 65816 emulation, not-quite-cycle-accurate SPC700 (this will change to fully accurate in the future), scanline-based PPU rendering, and no DSP emulation, all aligned perectly by the cycle, running Super Mario World and Zelda: Link to the Past, fast, on old-ish PCs, in pure JavaScript (on Chrome), with lots of headroom to spare

Surely, there's a lot left to do, but since the concept is currently proved, I have a new goal.

The biggest hassle with the source code to any emulator you find is building it. Even if you have the specialized knowledge required for whatever language and platforms the included build systems support, it can be a huge pain to compile the source.
This is doubly true for emulators that target WebAssembly.
I'd like to make good, well-written and performant emulators in JavaScript, arguably the best language in the world if you want ANYONE to be able to make changes and play with the code.

I'd also like to make Easy6502-like pages for each of the processors, to aid others' learning.

Basically, I want to make it as easy as possible in every possible way for anyone to play and understand vintage systems, processors, and ways of thinking.

I believe that understanding the way at least one microcomputer, such as an NES or Commodore64, works - fully and completely - irrevocably increases your competence as a programmer. This is a deep topic in the philosophy of software development, and beyond the scope of this README.

If I get super ambitious, I may even start SNES, NES, etc. development IDEs, but that would be very far off in the future.

I also keep a [blog](https://raddad772.github.io/) about development of JSMoo and emulators in genral. 

<!-- GETTING STARTED -->
## Getting Started

Currently, running JSMoo is a little bit of a pain.

Because we use SharedArrayBuffers and need high-precision timers, we need to include special HTTP headers. This means you can't just click on index.html and play it off your disk, it must be served to your browser.

I've included a simple Python script that will serve it to \[::1\]:8000, which is the IPv6 equivalent of localhost. Just run the simple_py_server.py, and navigate to \[::1\]:8000 in Chrome, and you're set!

The UI has seen drastic improvements recently. Switching between systems now works ("SYSTEM SELECT"), and controls can be remapped under the "Settings" tab.

To upload a ROM, make sure you have the correct system selected. Then scroll down, on the left, is a nav button named 'Upload'. Click it, then select and upload a file.

However, SMS and ZX Spectrum require BIOSes. These can be uploaded under Settings/BIOS.

As of this commit, keyboard input on the Spectrum is temporarily broken, as I have been re-writing the input system to support easily re-assignable controls and have only re-implemented joypads thus far.

As for game, etc. compatability, check COMPATABILITY.TXT for a info.

### Prerequisites

If you want to serve it locally using the script I included, you need Python3.

If you want it to run fast, you need Chrome. Sorry. I believe in the importance of Firefox, but finding information about how to optimize for SpiderMonkey is not easy. If you have experience here I'd be super happy to hear from you!

You need any applicable BIOSes for any systems that require them (currently SMS and ZX Spectrum).

### Installation

1. Clone the repo
   ```sh
   git clone https://github.com/raddad772/jsmoo.git
   ```
2. Run the Python script
   ```sh
   python3 simple_py_serve.py
   ```
3. Navigate Chrome to \[::1\]:8000

<p align="right">(<a href="#readme-top">back to top</a>)</p>


<!-- ROADMAP -->
## Roadmap

- [ ] Get Sega Master System working
- [ ] Overhaul the UI to make it more usable and flexible
- [ ] Find hosting for demo site (GitHub pages will not work due to required specialized HTTP headers)
- [ ] Basic Commodore64 support
- [ ] Potentially, PS1 emulation, which I now believe is possible
- [ ] Sega Genesis
- [ ] Set up an Easy6502-like suite for each of the processors
- [ ] Polish existing emulators to improve compatability and speed
- [ ] Probably at this point, some refactoring to make the code more uniform and easier to learn from

See the [open issues](https://github.com/raddad772/jsmoo/issues) for a full list of proposed features (and known issues).

<p align="right">(<a href="#readme-top">back to top</a>)</p>

<!-- CONTRIBUTING -->
## Contributing

You can do the fork and PR thing, but don't go too crazy. I'll gladly accept bug fixes, optimizations, code clean-ups, and other changes that improve the existing components. Or if you want to go ahead and do the UI re-design for me, I hate UI stuff. 

However for someone writing a whole new processor or system for inclusion, I'd like to have more of a partnership with people who share my vision of making retro systems accessible in every way to everyone - and you must also have some ability to write fast JavaScript code. I'm happy to guide someone, but I don't want just anything tacked onto JSMoo (at this point).

If you think that sounds like a fit for you, go through the trouble of finding my email address via my commits.

Or, if you want to work on bug fixes, etc., here's how to. And don't forget to give the project a star! Thanks again!

1. Fork the Project
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the Branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

<p align="right">(<a href="#readme-top">back to top</a>)</p>


<!-- LICENSE -->
## License

Distributed under the MIT License. See `LICENSE.txt` for more information.

<p align="right">(<a href="#readme-top">back to top</a>)</p>




<!-- CONTACT -->
## Contact

<!--Your Name - [@twitter_handle](https://twitter.com/twitter_handle) - email@email_client.com-->

Project Link: [https://github.com/raddad772/jsmoo](https://github.com/raddad772/jsmoo)

<p align="right">(<a href="#readme-top">back to top</a>)</p>



<!-- ACKNOWLEDGMENTS -->
## Acknowledgments

* []() Near, for his amazing work on Higan and contribution to the preservation and emulation of the SNES and other systems. I may criticize it for some of its design choices, but he still made an amazing set of emulators.
* []() The emulation community in general, without whom this project would be totally impossible.
* []() Thomas Harte, whose ProcessorTests have made my life a thousand times easier. Unit tests for processor emulators? BRILLIANT!

<p align="right">(<a href="#readme-top">back to top</a>)</p>



<!-- MARKDOWN LINKS & IMAGES -->
<!-- https://www.markdownguide.org/basic-syntax/#reference-style-links -->
[contributors-shield]: https://img.shields.io/github/contributors/raddad772/jsmoo.svg?style=for-the-badge
[contributors-url]: https://github.com/raddad772/jsmoo/graphs/contributors
[forks-shield]: https://img.shields.io/github/forks/raddad772/jsmoo.svg?style=for-the-badge
[forks-url]: https://github.com/raddad772/jsmoo/network/members
[stars-shield]: https://img.shields.io/github/stars/raddad772/jsmoo.svg?style=for-the-badge
[stars-url]: https://github.com/raddad772/jsmoo/stargazers
[issues-shield]: https://img.shields.io/github/issues/raddad772/jsmoo.svg?style=for-the-badge
[issues-url]: https://github.com/raddad772/jsmoo/issues
[license-shield]: https://img.shields.io/github/license/raddad772/jsmoo.svg?style=for-the-badge
[license-url]: https://github.com/raddad772/jsmoo/blob/master/LICENSE.txt
[linkedin-shield]: https://img.shields.io/badge/-LinkedIn-black.svg?style=for-the-badge&logo=linkedin&colorB=555
[linkedin-url]: https://linkedin.com/in/linkedin_username
[product-screenshot]: images/screenshot.png
[Next.js]: https://img.shields.io/badge/next.js-000000?style=for-the-badge&logo=nextdotjs&logoColor=white
[Next-url]: https://nextjs.org/
[React.js]: https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB
[React-url]: https://reactjs.org/
[Vue.js]: https://img.shields.io/badge/Vue.js-35495E?style=for-the-badge&logo=vuedotjs&logoColor=4FC08D
[Vue-url]: https://vuejs.org/
[Angular.io]: https://img.shields.io/badge/Angular-DD0031?style=for-the-badge&logo=angular&logoColor=white
[Angular-url]: https://angular.io/
[Svelte.dev]: https://img.shields.io/badge/Svelte-4A4A55?style=for-the-badge&logo=svelte&logoColor=FF3E00
[Svelte-url]: https://svelte.dev/
[Laravel.com]: https://img.shields.io/badge/Laravel-FF2D20?style=for-the-badge&logo=laravel&logoColor=white
[Laravel-url]: https://laravel.com
[Bootstrap.com]: https://img.shields.io/badge/Bootstrap-563D7C?style=for-the-badge&logo=bootstrap&logoColor=white
[Bootstrap-url]: https://getbootstrap.com
[JQuery.com]: https://img.shields.io/badge/jQuery-0769AD?style=for-the-badge&logo=jquery&logoColor=white
[JQuery-url]: https://jquery.com 
