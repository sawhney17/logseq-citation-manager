>If this plugin helps you, I'd really appreciate your support. You can [buy me a coffee here ](https://www.buymeacoffee.com/sawhney17) :)
# Logseq Citations Plugin

## BREAKING CHANGE in 3.0.0
- Version 3.0.0 had a breaking change. You will have to reconfigure the `.bib` export. It now has to be located in `~assets/storages/logseq-citation-manager` in settings, you just give the filename with extension(like `starred-items.bib`), no need for the file path.
- `~assets` refers to the folder that your database includes by default. 

## Installation
- This plugin can be installed from the Logseq marketplace
## Features
- Supports customisable page and block templates
- Supports embedding and linking to Bibtex items in the form of pages *and* links
- Supports Zotero, Paperpile and other applications with supports for .bib references
- Supports aliases for the links to the reference
- 100% local
- Performant with over 6000 references!

## Instructions
1. Install the plugin
2. Configure templates, you can use the provided templates here for inspiration. Templates have to be added on a per graph basis. 
3. Configure settings
4. Call the citation insertion UI
	- Use `/Create Inline Literature Note` to insert a literature note inline based on a block template. Also callable via `mod+shift+I`
	- Use `/Create Inline Link to Lit Note` to create a page following a specific template and insert a link(optionally aliased) in the currrent block. Also callable via `mod+shift+L`
	- Use `/Search and open reference as page` to search for a reference and create it as a page following a specific template if it doesn't already exist. Also callable via `mod+shift+o`
5. Select the reference using the keyboard or mouse
6. Watch as your action is performed!


## Paperpile
- For usage with Paperpile, create a synced export to the .bib format
- Use a sync provider to make it persist on desktop
## Zotero
- If you use **Zotero** with [Better BibTeX]
  - Select a collection in Zotero's left sidebar that you want to export.
  - Click `File` -> `Export library ...`. Select `Better BibLaTeX` or `Better CSL JSON` as the format. (We recommend using the BibLaTeX export unless you experience performance issues. The BibLaTeX format includes more information that you can reference from logseq, such as associated PDF attachments, but loads more slowly than the JSON export.)
  - You can optionally choose "Keep updated" to automatically re-export the collection -- this is recommended!
## Configuration
- This plugin has a variety of configuration options
- `citationReferenceDB`
	- This path is the directory where your .bib database is located
- `smartsearch`
	- This is a toggle that allows you to use fuzzy search for the search, depends on your own use case and preference. 
- `indexAbstracts`
	- This is a toggle that allows you to index the abstract of the reference in the search. This can make search results more relevant but can also slow down the search.
- `templatePage`
	- This is the path to the page template that will be used to create pages for the references. Simply create a page and name it whatever you want. Type the name of the page here. The page can use dynamic variables like {type}, {author}, {citekey}, {author lastname}, {abstract} etc. 
	- When you create a page via a citation, the page will follow the template of the specified page and will automatically resolve the dynamic variables to it's actual values. You can use any field from the reference as a dynamic variable. 
- `templateBlock`
	- This is the name of a template, created via logseq's "make template" feature. This template is used in the inline citation insertion feature.
	- When you create a block via a citation, the block will follow the template of the specified block and will automatically resolve the dynamic variables to it's actual values.
- `linkAlias`
	- For inserted links, optionally display an alias to the page. i.e. writing `{author lastname} {year}` would create a link to the actual citation page but it would display as `[Appel 2012]([[Appel2012-ej]])`. Leave it blank if aliases are not desired. For more about aliases visit: https://aryansawhney.com/pages/the-ultimate-guide-to-aliases-in-logseq/"
- `pageTitle`
	- This is the title of the page that is created. It defaults to using the citekey and this is the recommended approach in order to ensure that all references are unique. You can, however, play around, and add more items and fields to the title if desired. 
	- You can use dynamic variables like {type}, {author}, {citekey}, {author lastname} etc. in this field
- `reindexOnStartup`
	- By default, when you call the plugin for the first time after restarting logseq, it will index all the references in the database. This time is usually not significant and won't be noticeable. However, if you have a lot of references, over a thousand, it may take a while. 
	- By turning this off, logseq implements a local cache of the references so that you won't have to do the initial indexing every time you call the plugin for the first time after restart. This is a good idea if you have a lot of references in your database but it is important to note that changes you make in your citation manager plugin will *not* be reflected here by default. 
	- If you want to force the reindexing of the references, you can force reindex via the command pallete and searching for `reindex`. This could take a while so be patient. 

## Templates
 - You can check out ./citation_manager_template.md for an example of a page template
 - Here is an example of a inline literature note template
	```
	- {title} by {author}
		- {abstract}
	```
## Dynamic placeholders
- Any field that is stored in bibtex file can be extracted and be used in a tempalate
- For example, using {title} will result in the title being replaced dynamically when calling the template
- Here is a non exhaustive list of dynamic placeholders as well as special placeholders that perform additional functionality
- {year}
	- The year in the form of 2017
- {file++}
    -  Uses the filetemplate format to add *all file attachments in the form of a link for example* 
	- This template supports more fields like {filelink}, {filename} and {citekey}
- {type}
	- the type of file it is(article, book etc.)
- {author}
	- The author of the source
- {author lastname}
	- The lastname of the author of the source
- {author firstname}
	- The firstname of the author of the source
## Credits
- Development of this plugin has been financially supported by the [Global Partnership Network]( https://www.uni-kassel.de/forschung/global-partnership-network/home) at the University of Kassel
- Credits to [Obsidian Citation Plugin](https://github.com/hans/obsidian-citation-plugin) for direct inspiration
- Credits to [Kerim](https://github.com/kerim) for sponsoring and the idea for the plugin


