# To learn more about how to use Nix to configure your environment:
# https://developers.google.com/idx/guides/customize-idx-env
{ pkgs, ... }: {
  # Channel to use
  channel = "stable-23.11";
  
  # List packages to install in the environment
  packages = [
    pkgs.dotnet-sdk_10
    pkgs.nodejs_20
  ];
  
  # Search for the extensions you want on https://open-vsx.org/ and use "publisher.id"
  idx = {
    extensions = [
      "ms-dotnettools.csharp"
      "bradlc.vscode-tailwindcss"
      "dsznajder.es7-react-js-snippets"
    ];
    
    # Enable previews and customize configuration
    previews = {
      enable = true;
      previews = {
        web = {
          command = ["npm" "run" "dev" "--" "--port" "$PORT" "--host" "0.0.0.0"];
          manager = "web";
          cwd = "Frontend";
        };
      };
    };
    
    # Lifecycle hooks to run when the workspace is created/started
    onCreate = {
      npm-install = "npm install --prefix Frontend";
    };
  };
}
